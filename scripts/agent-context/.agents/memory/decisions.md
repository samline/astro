# Architecture decisions

## Inherited base conventions

The project begins with static output and the selected deployment adapter.
Add full SSR only when a project requirement justifies it. Keep sections and
reusable components separate, with the document and metadata owned by Main.

Section provides semantics and vertical spacing; Box constrains content width.
Link uses native navigation and Astro localization helpers. Components read the
current locale themselves, except across isolated server boundaries.

Tailwind owns design tokens. Theme initialization runs before paint. GTM is
optional and starts with denied consent signals; analytics and advertising are
independent. PageLoader retains ldrs to make animation changes straightforward.

Keep the inherited component API documentation alongside the source. Read it
before altering behavior; record new project decisions below as they are made.

## Project decisions

None recorded yet.
