import { getDictionary, resolveLocale } from '../../i18n'

export interface FormMail {
  locale?: string
  title: string
  fields: ReadonlyArray<{ label: string; value: string }>
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character]!
  )

export const renderFormMail = ({ locale, title, fields }: FormMail) => {
  const language = resolveLocale(locale)
  const copy = getDictionary(language).mail
  const text = [
    copy.greeting,
    copy.introduction,
    title,
    ...fields.map(({ label, value }) => `${label}:\n${value}`),
    copy.closing
  ].join('\n\n')
  const rows = fields
    .map(
      ({ label, value }) =>
        `<tr><th scope="row" style="padding:0.75rem;text-align:start;vertical-align:top;border-bottom:0.0625rem solid #ddd">${escapeHtml(label)}</th><td style="padding:0.75rem;white-space:pre-wrap;overflow-wrap:anywhere;border-bottom:0.0625rem solid #ddd">${escapeHtml(value)}</td></tr>`
    )
    .join('')
  const html = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:1.25rem;background:#fff;color:#000;font-family:Arial,sans-serif;line-height:1.5">
<p>${escapeHtml(copy.greeting)}</p><p>${escapeHtml(copy.introduction)}</p>
<h1 style="font-size:1.5rem">${escapeHtml(title)}</h1>
<table style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>
<p>${escapeHtml(copy.closing)}</p></body></html>`
  return { subject: title, text, html }
}
