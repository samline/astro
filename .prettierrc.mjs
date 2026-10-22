/** @type {import('prettier').Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  singleQuote: true,
  jsxSingleQuote: true,
  semi: false,
  trailingComma: 'none',
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' }
    }
  ]
}
