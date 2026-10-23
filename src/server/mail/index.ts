import { getSecret } from 'astro:env/server'
import { createMailer, type MailMessage } from './mailer'
import { renderFormMail, type FormMail } from './template'

const deliver = createMailer(getSecret)

export const sendMail = (message: MailMessage) => deliver(message)

export const sendFormMail = ({
  replyTo,
  ...form
}: FormMail & { replyTo?: string }) =>
  sendMail({ ...renderFormMail(form), replyTo })

export { renderFormMail }
export type { FormMail, MailMessage }
