# Optional reveal recipe

The canonical copyable implementation and acceptance matrix live in the
[portable recipe source](../../scripts/agent-context/.agents/memory/reveal-recipe.md).
Edit that source; prepare-package includes it in generated projects. The recipe
stays opt-in and section-owned, with no additional runtime dependency.

Tests extract its actual TypeScript and Astro examples instead of maintaining a
parallel implementation. The website Reveal has its own lifecycle and remains
independent.
