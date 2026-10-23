import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface MailMessage {
  subject: string
  text: string
  html?: string
  replyTo?: string
}

type ReadSecret = (name: string) => string | undefined
type TransportFactory = (options: SMTPTransport.Options) => {
  sendMail: (message: SendMailOptions) => Promise<SMTPTransport.SentMessageInfo>
}

const required = (read: ReadSecret, name: string) => {
  const value = read(name)
  if (!value?.trim()) throw new Error(`Missing mail configuration: ${name}`)
  return value
}

const mailbox = (value: string) => {
  if (
    value.length > 254 ||
    !/^[^\s<>@,;"\x00-\x1f\x7f]+@[^\s<>@,;"\x00-\x1f\x7f]+\.[^\s<>@,;"\x00-\x1f\x7f]+$/.test(
      value
    )
  ) {
    throw new Error('Mail addresses must be a single plain email address.')
  }
  return value
}

export const createMailer =
  (
    read: ReadSecret,
    transport: TransportFactory = (options) =>
      nodemailer.createTransport(options)
  ) =>
  async (message: MailMessage) => {
    if (read('MAIL_ENABLED') !== 'true')
      throw new Error('Mail sending is disabled.')
    const host = required(read, 'SMTP_HOST').trim()
    const portValue = read('SMTP_PORT') ?? '587'
    const port = Number(portValue)
    if (
      !/^\d+$/.test(portValue) ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      throw new Error('SMTP_PORT must be an integer between 1 and 65535.')
    }
    const secureValue = read('SMTP_SECURE') ?? (port === 465 ? 'true' : 'false')
    if (!['true', 'false'].includes(secureValue))
      throw new Error('SMTP_SECURE must be true or false.')
    const secure = secureValue === 'true'
    const user = required(read, 'SMTP_USER')
    const pass = required(read, 'SMTP_PASSWORD')
    const from = mailbox(required(read, 'MAIL_FROM').trim())
    const to = mailbox(required(read, 'MAIL_TO').trim())
    if (
      !message.subject?.trim() ||
      message.subject.length > 998 ||
      /[\x00-\x1f\x7f]/.test(message.subject)
    ) {
      throw new Error(
        'Mail subject must be a nonempty single line of at most 998 characters.'
      )
    }
    if (!message.text?.trim())
      throw new Error('Mail requires a plain-text body.')
    const replyTo =
      message.replyTo === undefined
        ? undefined
        : mailbox(message.replyTo.trim())
    const sender = transport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      disableFileAccess: true,
      disableUrlAccess: true
    })
    const result = await sender
      .sendMail({
        from,
        to,
        replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
        disableFileAccess: true,
        disableUrlAccess: true
      })
      .catch(() => {
        throw new Error('Mail delivery failed.')
      })
    if (!result.accepted?.length || result.rejected?.length) {
      throw new Error('SMTP server did not accept the configured recipient.')
    }
    return { messageId: result.messageId }
  }
