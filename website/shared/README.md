# Shared website presentation

One owner for Box, headings, typography/fonts, palette, Theme, Buttons, Tabs,
CodeFrame/CopyButton, Drawers and integration mounting. Home, Examples and Docs
are build boundaries, not separate design systems. Do not import a sibling app
implementation. Shared recipes live in i18n/translations/en/recipes.ts;
components/Playground renders their real CLI commands and summarized output.

lib/project.mjs derives site/base from project.config.json and prepared version
from the actual CLI manifest. Source references use data/references.json. The
site never bundles the starter's runtime. Preserve font names and OFL licenses,
local WOFF2 loading, optional motion and live code copying. Read ../README.md,
../REFERENCE.md and ../AGENTS.md before changing protected source. Source
fingerprints supplement screenshots and behavior tests, not replace them.
