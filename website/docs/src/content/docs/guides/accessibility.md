---
title: 'Review accessibility'
description: 'Check the headings, controls, feedback and interaction states in the site you build from this distribution.'
locale: en
sidebar:
  group: guides
  order: 8
---

## Start with the supplied components

The supplied components use native HTML, associated form labels and errors,
visible focus states and reduced-motion alternatives. Theme and consent controls
include their own documented accessible states. Each component's reference
explains its behavior and the labels it needs from your dictionaries.

Accessibility also depends on the content and composition you add. Give each
page a meaningful heading order, name controls clearly, describe informative
images, and keep translated feedback associated with the relevant input or
operation.

## Check the finished page

Review the actual interface with:

- Keyboard navigation: logical focus order, visible focus, operable controls and predictable return from dialogs.
- A screen reader: headings, landmarks, control names, validation errors and status messages.
- Both themes, a narrow viewport and enlarged text: readable contrast, wrapping and reachable controls.
- Reduced motion and loading/error states: usable feedback without relying only on animation or color.
- JavaScript disabled where a fallback is expected: readable content and an understandable path for unavailable controls.

Test authentication, consent and external widgets again after adding real project
configuration. Automated checks help find regressions; manual review confirms
whether the completed experience makes sense.

## Use the right reference

The [component references](../../reference/components/box/) cover the local
wrappers supplied here. Astro's
[component documentation](https://docs.astro.build/en/basics/astro-components/)
covers framework rendering and native attributes. Consult a third-party widget's
documentation for behavior inside its own interface.
