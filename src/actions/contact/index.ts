import { ActionError, defineAction } from 'astro:actions'
import { getDictionary } from '../../i18n'
import { sendFormMail } from '../../server/mail'
import { verifyCaptcha } from '../../server/captcha'
import { contactInput } from './schema'

export const contact = defineAction({
  accept: 'form',
  input: contactInput,
  handler: async (
    { locale, name, email, phone, message, website, captchaToken },
    context
  ) => {
    const dictionary = getDictionary(locale)
    const copy = dictionary.forms.messages
    if (context.request.headers.get('origin') !== context.url.origin) {
      throw new ActionError({ code: 'FORBIDDEN', message: copy.forbidden })
    }
    if (website.trim()) return { success: true, message: copy.success }
    if (!(await verifyCaptcha(captchaToken))) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: dictionary.captcha.invalid
      })
    }
    try {
      await sendFormMail({
        locale,
        title: dictionary.mail.contactTitle,
        replyTo: email,
        fields: [
          { label: dictionary.forms.labels.name, value: name },
          { label: dictionary.forms.labels.email, value: email },
          ...(phone
            ? [{ label: dictionary.forms.labels.phone, value: phone }]
            : []),
          { label: dictionary.forms.labels.message, value: message }
        ]
      })
    } catch {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: copy.error
      })
    }
    return { success: true, message: copy.success }
  }
})
