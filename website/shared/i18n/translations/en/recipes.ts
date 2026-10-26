export const recipes = [
  {
    id: 'minimal',
    label: 'Create a project',
    title: 'Create a static project',
    description:
      'Start with the core configuration and a simple homepage. Optional integrations are omitted until you choose to add them.',
    runFrom: 'The parent folder where you keep your projects.',
    requires:
      'Node 22.23.4 or newer, with your chosen package manager available. Use a new or empty folder named my-site. See the local-package instructions while npm publication is pending.',
    command:
      'npx @samline/astro my-site --minimal --deploy static --locale en-us',
    result:
      'The installer creates my-site with Astro, Tailwind, local fonts, SEO components, a homepage and English dictionaries. Dependency installation uses the selected manager; add --package-manager npm, pnpm or bun to choose explicitly.',
    files:
      'my-site/\n  astro.config.mjs\n  src/layouts/Main.astro\n  src/sections/Home/\n  src/i18n/dictionaries/en-us/\n  public/img/  public/docs/  public/video/',
    note: 'No server adapter is installed. This project builds files for static hosting; server features need a compatible adapter and runtime.',
    nextStep:
      'Run cd my-site, then the development command in the generated README (npm run dev, pnpm run dev or bun run dev). Edit src/sections/Home/index.astro to build your homepage.',
    guide: 'getting-started/'
  },
  {
    id: 'forms',
    label: 'Add Fields',
    title: 'Add form controls to an existing project',
    description:
      'Add Astro components for native form controls, together with @samline/forms and @samline/formatter. You still create the form section and choose its submission handler.',
    runFrom:
      'Your generated project root: the folder containing package.json and astro.config.mjs.',
    requires:
      'A project created by this modular installer. Create the project in the first recipe before running add.',
    command: 'npx @samline/astro add fields',
    result:
      'Form, Input, Select and the other Fields components, their styles and API docs, plus the package usage guide in src/forms. Both package dependencies are included.',
    files:
      'src/components/Fields/\nsrc/forms/README.md\nsrc/i18n/dictionaries/<your-locale>/forms/\n\nDependencies: @samline/forms, @samline/formatter',
    note: 'To add the packages and usage guide without the Fields components, run npx @samline/astro add forms and decline Fields when prompted.',
    nextStep:
      'Read src/components/Fields/README.md, then compose Form, Input and Button inside your own section. Add labels to your dictionaries and connect an Action or endpoint before expecting submission to work.',
    guide: 'reference/components/fields/'
  },
  {
    id: 'content',
    label: 'Add content',
    title: 'Add a local articles collection',
    description:
      'Register a collection named articles with a schema and local sample data. This prepares content to query; you still build the article list and pages.',
    runFrom:
      'Your generated project root: the folder containing package.json and astro.config.mjs.',
    requires:
      'A project created by this modular installer. The collection name articles must not conflict with your own source.',
    command:
      'npx @samline/astro add content --source local --collection articles',
    result:
      'src/content.config.ts registers articles. The example stores locale, a dictionary copy key, a date and a draft flag in JSON, with display text in the content dictionary. It works offline.',
    files:
      'src/content.config.ts\nsrc/content/articles/\n  README.md\n  index.ts\n  data/',
    note: 'Choose API, Strapi, Shopify or another service when content lives elsewhere. Those examples need your source schema, credentials and explicit activation.',
    nextStep:
      'Open src/content/articles/README.md for the getCollection example. Query articles from your content section, resolve the sample copy key through the dictionary, then replace the example with your project’s content model.',
    guide: 'guides/content/'
  }
] as const
