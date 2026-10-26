import { recipes } from '../../../../../shared/i18n/translations/en/recipes'
const text = (value: string) => [{ kind: 'text' as const, value }]
const heading = (prefix: string, accent: string) => [
  ...text(prefix + ' '),
  { kind: 'emphasis' as const, value: accent }
]
const code = (source: string) => ({
  filename: 'Terminal',
  code: source,
  language: 'bash' as const
})
export default {
  hero: {
    kicker: 'An independent distribution for Astro 7',
    availability: 'Create your project with npm, pnpm or Bun.',
    title: 'Start with Astro.',
    titleAccent: 'Add what you need.',
    description: 'A configured project, ready for your own source.',
    descriptionContinuation:
      'Choose integrations now, then add more as your site grows.',
    footnotes: ['SSG by default', 'Add integrations later', 'Editable source'],
    compatibilityLabel: 'Choose your deployment target',
    platforms: ['Static', 'Vercel', 'Netlify', 'Cloudflare', 'Custom']
  },
  features: {
    eyebrow: '01 / What the starter includes',
    title: 'Less setup.',
    titleAccent: 'A clear starting point.',
    items: {
      dependencies: {
        title: 'Only what you select',
        description: text(
          'Choose optional integrations in the wizard. Features you omit leave out their source, dependencies and configuration.'
        )
      },
      accessibility: {
        title: 'Clear UI composition',
        description: text(
          'Pages compose a layout, sections and reusable components. Section handles spacing; Box handles width. Component API docs stay beside the source.'
        )
      },
      lifecycle: {
        title: 'Add integrations later',
        description: text(
          'Run add from a generated project to include a missing integration. The installer checks supported structures and reports conflicts before applying the planned files.'
        )
      },
      entrypoints: {
        title: 'A language you choose',
        description: text(
          'Start in English, Spanish for Mexico or Spanish for Spain. Custom languages use empty dictionaries; later additions follow your project’s current keys.'
        )
      },
      frameworks: {
        title: 'Configured tools',
        description: text(
          'Astro 7, TypeScript, Tailwind 4, Prettier and local fonts. Choose npm, pnpm or Bun for dependencies, and Node.js or Bun for project scripts.'
        )
      },
      markup: {
        title: 'Astro stays Astro',
        description: text(
          '@samline/astro prepares the project and integration examples. Astro provides routing, rendering, islands, Actions and Content Collections; learn those APIs in its official docs.'
        )
      }
    }
  },
  runtimes: {
    eyebrow: '02 / Optional integrations',
    heading: heading('Choose the setup.', 'Configure your services.'),
    description:
      'The wizard includes only the features you choose. Later, use add in the generated project. Service credentials, business rules and production testing remain part of your project.',
    items: {
      presentation: {
        label: 'Presentation',
        entrypoint: 'Themes · PageLoader · Icons',
        description:
          'Add light/dark theme controls, a PageLoader with a changeable animation, or Font Awesome SVG icons.'
      },
      forms: {
        label: 'Input',
        entrypoint: 'Forms + Formatter · Fields',
        description:
          '@samline/forms and @samline/formatter install together. Include Fields if you also want Astro templates for form controls.'
      },
      auth: {
        label: 'Identity',
        entrypoint: 'Better Auth',
        description:
          'Prepare external REST identities, OAuth/OIDC or project-owned PostgreSQL. You supply the provider settings, access rules and account interface.'
      },
      privacy: {
        label: 'Privacy',
        entrypoint: 'GTM + consent · CAPTCHA',
        description:
          'GTM includes cookie consent. CAPTCHA offers Turnstile or reCAPTCHA v2. Configure your container, consent choices and provider keys before use.'
      },
      content: {
        label: 'Content',
        entrypoint: 'Local · API · CMS',
        description:
          'Use local files or an API, Strapi, Shopify or custom-service example. Remote sources offer build-time or live loading and require your configuration.'
      },
      server: {
        label: 'Server examples',
        entrypoint: 'Actions · SMTP mail',
        description:
          'Actions includes a basic example. Mail includes an SMTP sender and contact Action. Running them requires a compatible server adapter.'
      }
    }
  },
  gettingStarted: {
    eyebrow: '03 / Create, run, extend',
    heading: heading('Create your project.', 'Then build with Astro.'),
    integrationDescription:
      'Choose your package manager and run the command from the folder that will contain your project. The wizard guides you through deployment, languages and integrations.',
    integrationLabel: 'Read installation instructions',
    steps: { install: 'Choose', markup: 'Run', initialize: 'Extend' },
    fullExampleLabel: 'Read the installer reference',
    markupDescription:
      'Choose the tab matching your tools. The installer normally installs dependencies; if you use --no-install, run your selected manager’s install command first.',
    examples: {
      markup: code('cd my-site\nbun run dev'),
      script: code('npx @samline/astro add themes\nnpx @samline/astro status')
    },
    docs: {
      description:
        'Read our docs for installer choices, generated files and component usage. Follow the linked Astro docs for framework behavior.',
      label: 'Read what the distribution configures'
    }
  },
  recipes: {
    eyebrow: '04 / Three setup examples',
    title: 'Create a project.',
    titleAccent: 'Add its next feature.',
    description:
      'Create the static project first. Run the other commands from its root to add Fields or local content. The examples page explains each result and next step.',
    examplesLabel: 'Read the setup examples',
    items: recipes.map((recipe) => ({
      title: recipe.title,
      context: recipe.label,
      docsRoute: 'examples' as const,
      docsLabel: 'Read this setup example',
      description: text(recipe.description),
      code: code(recipe.command)
    }))
  },
  faq: {
    eyebrow: '06 / Common questions',
    heading: heading('Before you start.', 'What to expect.'),
    items: {
      astro: {
        question: text('What does @samline/astro add to Astro?'),
        answer: text(
          'It creates an Astro 7 project with shared configuration, typed translation dictionaries, reusable components and the optional integrations you choose. You edit the generated source in your own repository. Astro still provides routing, rendering, Server Islands, Actions and Content Collections; its official documentation explains those APIs.'
        ),
        guide: '',
        guideLabel: 'Understand the starter'
      },
      start: {
        question: text('What will I see when I run a new project?'),
        answer: text(
          'The interactive wizard proposes the Welcome demo: Home and a second page with a shared header, navigation and footer. The navigation marks the current page. Themes and a language picker appear only when selected. Use --minimal, or choose none in the feature prompt, for a core homepage without the demo.'
        ),
        guide: 'guides/starter-demo/',
        guideLabel: 'Explore the starter demo'
      },
      tools: {
        question: text('Can I choose npm, pnpm or Bun?'),
        answer: text(
          'Yes. Choose npm, pnpm or Bun for dependencies and Node.js or Bun for scripts. The wizard lists tools available on your computer; unattended commands use --package-manager and --runtime. Your choices are recorded in the generated project and respected by later additions. Node 22.23.4 or newer is required by the installer.'
        ),
        guide: 'getting-started/',
        guideLabel: 'Check requirements and first steps'
      },
      optional: {
        question: text('Can I add an integration after creating the site?'),
        answer: text(
          'Yes. Run npx @samline/astro add inside a project created by this modular installer and choose the missing feature. Use --dry-run to inspect the changes. The installer preserves unrelated code and stops when files or registrations conflict. Adding the Welcome demo later keeps your current homepage and supplies a separate demo route.'
        ),
        guide: 'guides/integrations/',
        guideLabel: 'See what each integration adds'
      },
      deployment: {
        question: text('Which hosting target should I choose?'),
        answer: text(
          'Vercel is the default. You can also choose pure static hosting, Netlify, Cloudflare Workers or a custom Node server. The installer prepares the matching configuration and adapter where needed; it does not deploy anything. Choose according to the runtime your selected integrations require, particularly authentication, live content and SMTP.'
        ),
        guide: 'guides/deployment/',
        guideLabel: 'Compare deployment targets'
      },
      server: {
        question: text(
          'Can static pages use authentication or other server features?'
        ),
        answer: text(
          'Yes, prebuilt public pages can use Server Islands with a compatible Astro adapter. Active Actions, protected routes and live content also need server execution. Pure static hosting has no runtime for them; inactive examples must be configured with a backend before use. Adding one server feature does not require turning the entire site into SSR.'
        ),
        guide: 'guides/deployment/',
        guideLabel: 'Understand static and server execution'
      },
      forms: {
        question: text('What is the difference between Forms and Fields?'),
        answer: text(
          'Forms installs both @samline/forms and @samline/formatter for form state, validation and formatting. Fields is an optional set of Astro templates for controls, labels, hints and errors. You can use the packages with your own markup, or add Fields later. A complete form still needs its owning section and a submission handler.'
        ),
        guide: 'reference/components/fields/',
        guideLabel: 'Build a form with Fields'
      },
      mail: {
        question: text('Does installing Mail create a working contact form?'),
        answer: text(
          'Mail includes the server SMTP service and its Contact Action example. It does not create a contact page or send messages immediately. Supply SMTP settings, enable sending and connect your form to the Action on a compatible server target. CAPTCHA is a separate choice; when installed with Mail, its server verification is connected to the contact example.'
        ),
        guide: 'reference/contact/',
        guideLabel: 'Configure contact submissions'
      },
      content: {
        question: text('Can content come from an API, Strapi or Shopify?'),
        answer: text(
          'Yes. Choose local files, a generic REST or GraphQL API, Strapi, Shopify Storefront or a custom service. The installer includes only that source’s schema, loader and read example. Local content works offline. Remote examples require your configuration and explicit activation. Build-time loading produces static content; live loading needs an adapter and a request-time consumer.'
        ),
        guide: 'guides/content/',
        guideLabel: 'Choose a content source'
      },
      languages: {
        question: text('How do languages and translated URLs work?'),
        answer: text(
          'Choose en-us, es-mx, es-es or a custom locale during setup. Adding a language later mirrors the project’s current dictionary keys with empty translations and leaves it inactive until completed. This does not translate posts or CMS records. When equivalent pages use different slugs, supply their actual translation relationship for navigation and SEO.'
        ),
        guide: 'guides/languages/',
        guideLabel: 'Set up dictionaries and translated destinations'
      },
      auth: {
        question: text(
          'Can users live in Laravel or another external backend?'
        ),
        answer: text(
          'The optional authentication source supports an external REST identity service, OAuth/OIDC or project-owned users through Better Auth. Adapt the provider contract and configure sessions, permissions and protected operations for your application. Installing the source does not create an account interface, configure a database or run migrations.'
        ),
        guide: 'reference/auth/',
        guideLabel: 'Configure the authentication boundary'
      },
      updates: {
        question: text('How do I update Astro or the generated source?'),
        answer: text(
          'Use Astro’s official upgrade tool for Astro and installed official integrations, starting with a dry run. Review other dependencies separately. A newer @samline/astro generator can create projects or add missing features; it does not merge changes into previously copied source. There is currently no automatic base-source update command.'
        ),
        guide: 'guides/updating/',
        guideLabel: 'Follow the update workflow'
      },
      license: {
        question: text(
          'Can I use this starter for client or commercial projects?'
        ),
        answer: text(
          'The original installer and starter source are MIT licensed. Included dependencies, fonts, icons and third-party skills retain their own terms and notices. Keep the applicable notices when distributing their material. The generated application belongs to your project; the installer does not assign a license to your independently authored application.'
        ),
        guide: 'reference/api/#license',
        guideLabel: 'Read the distribution license notes'
      },
      automation: {
        question: text('Can I create a project without interactive questions?'),
        answer: text(
          'Yes. Use --minimal for the core, or --yes with explicit deployment, language and feature flags. Set --package-manager and --runtime to choose tools explicitly. Use --no-install when dependency installation belongs to a separate step, and --dry-run to inspect planned changes. The command reference lists the available flags.'
        ),
        guide: 'reference/api/',
        guideLabel: 'Read the command options'
      }
    }
  },
  callToAction: {
    eyebrow: 'Start with the installation guide',
    heading: heading('Choose your setup.', 'Build your site.'),
    description: 'See what gets generated, how to run it and where to edit.',
    docs: {
      description:
        'These docs cover @samline/astro. Framework guides link directly to Astro.',
      label: 'Read the distribution docs'
    }
  }
} as const
