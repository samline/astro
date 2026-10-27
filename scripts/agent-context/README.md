# Portable project agent context

These files seed new projects. They are deliberately separate from the kit's
maintainer memory under the root .agents directory. Edit this source, never the
generated packages/cli/template copy.

Prepare-package copies only agentContextFiles from lib/agents.mjs, adds the
selected skill folders from root .agents/skills, and filters skill provenance.
CreateProject then renders project identity/tool/deployment placeholders and
removes the Vercel deployment skill when another target is chosen.

Keep new-project lessons and todos empty. Record reusable base conventions here;
omit personal attribution, conversations, session histories, old test results
and completed or abandoned work from repository and portable context. Preserve upstream skill bytes, references, and licenses.

The package validator allows only this seed structure and the selected skills.
Integration tests verify provider/tool combinations and generation from a real
tarball, including the absence of maintainer history and unresolved placeholders.
