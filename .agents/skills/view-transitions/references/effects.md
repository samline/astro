# Effect dictionary

A catalogue of page-transition effects written as plain View Transitions CSS for
Astro's ClientRouter. Entries are examples to pick from, never a set to ship together:
choose one default and one or two reasoned exceptions. Each page-level entry targets
`::view-transition-old(root)` and `::view-transition-new(root)`. The website guide
"Use view transitions" shows live previews of these same keyframes.

Each entry applies to the whole page between the header and footer. Copy only the entries you need and keep the `vt-fade-out` rule they share. Adapt colours and shapes to the project.

### Lift

The default for ordinary pages: a short breath that never competes with content. Duration 340ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-lift 340ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-lift {
  from {
    opacity: 0;
    translate: 0 1rem;
  }
}
```

### Quiet fade

Legal pages, settings and anything that should feel almost like a plain navigation. Duration 200ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-fade 200ms ease-out 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-fade {
  from {
    opacity: 0;
  }
}
```

### Gentle zoom

Directories and listings: the page settles in from slightly smaller. Duration 620ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-zoom 620ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-zoom {
  from {
    opacity: 0;
    scale: 0.94;
    translate: 0 1.5rem;
  }
}
```

### Wipe, left to right

Editorial or story pages: content is uncovered in reading direction. Duration 660ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-wipe-right 660ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-wipe-right {
  from {
    opacity: 0;
    translate: 2rem 0;
    clip-path: inset(0 100% 0 0);
  }
  to {
    opacity: 1;
    translate: 0 0;
    clip-path: inset(0);
  }
}
```

### Wipe, right to left

The opposite direction; pair it with the previous one for related sections. Duration 660ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-wipe-left 660ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-wipe-left {
  from {
    opacity: 0;
    translate: -2rem 0;
    clip-path: inset(0 0 0 100%);
  }
  to {
    opacity: 1;
    translate: 0 0;
    clip-path: inset(0);
  }
}
```

### Vertical wipe

Reference material or catalogues: the page unrolls from the top. Duration 580ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-wipe-down 580ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-wipe-down {
  from {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0);
  }
}
```

### Center opening

Contact or conversion pages: content opens outward from the middle. Duration 680ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-center-open 680ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-center-open {
  from {
    opacity: 0;
    clip-path: inset(0 50% 0 50%);
  }
  to {
    opacity: 1;
    clip-path: inset(0);
  }
}
```

### Diagonal reveal

Brand or showcase pages that can afford a sharper gesture. Duration 720ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-diagonal 720ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-diagonal {
  from {
    opacity: 0.6;
    clip-path: polygon(0 0, 0 0, 0 0, 0 100%);
  }
  45% {
    opacity: 1;
    clip-path: polygon(0 0, 70% 0, 15% 100%, 0 100%);
  }
  to {
    opacity: 1;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
```

### Iris

A home page or a hero: the new page opens like an aperture from a point. Set `--vt-x` and `--vt-y` to the click or to a fixed spot. Duration 640ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-iris 640ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-iris {
  from {
    opacity: 0.5;
    clip-path: circle(0vmax at var(--vt-x, 50%) var(--vt-y, 8rem));
  }
  to {
    opacity: 1;
    clip-path: circle(150vmax at var(--vt-x, 50%) var(--vt-y, 8rem));
  }
}
```

### Iris from a corner

The same keyframes with another origin: an offset aperture reads as a different scene. Duration 640ms.

```css
::view-transition-old(root) {
  animation: vt-fade-out 120ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-iris 640ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;
}
@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-iris {
  from {
    opacity: 0.5;
    clip-path: circle(0vmax at var(--vt-x, 50%) var(--vt-y, 8rem));
  }
  to {
    opacity: 1;
    clip-path: circle(150vmax at var(--vt-x, 50%) var(--vt-y, 8rem));
  }
}
/* Set the origin from script or per route. */
:root {
  --vt-x: 20%;
  --vt-y: 12rem;
}
```

### Step

Wizards, quizzes and carousels: content moves sideways and reverses on Back. Duration 380ms.

```css
::view-transition-old(root) {
  animation: vt-step-out 200ms ease-in both;
}
::view-transition-new(root) {
  animation: vt-step-in 380ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}
:root {
  --vt-step: 3rem;
}
:root[data-astro-transition='back'] {
  --vt-step: -3rem;
}
@keyframes vt-step-out {
  to {
    opacity: 0;
    translate: calc(var(--vt-step) * -1) 0;
  }
}
@keyframes vt-step-in {
  from {
    opacity: 0;
    translate: var(--vt-step, 3rem) 0;
  }
}
```

### Brand curtain

A full-width panel of brand colour sweeps across; the new page follows it in. Duration 400ms.

```css
/* The group paints the brand colour; the old page leaves, the new one follows. */
::view-transition-group(root) {
  background: var(--color-primary);
}
::view-transition-old(root) {
  animation: vt-curtain-out 280ms cubic-bezier(0.7, 0, 0.2, 1) both;
}
::view-transition-new(root) {
  animation: vt-curtain-in 400ms cubic-bezier(0.7, 0, 0.2, 1) 160ms both;
}
@keyframes vt-curtain-out {
  to {
    translate: 100% 0;
  }
}
@keyframes vt-curtain-in {
  from {
    translate: -100% 0;
  }
}
```

### Paw stamp

A signature effect: a shape grows at the click point, lingers long enough to read,
then floods the page while the old page recedes underneath. Because the old page
stays visible below the mask, no background colour of the next page can show through
or clash with a fixed header. Any SVG shape works as the mask: a logo, a heart, a star.

```css
::view-transition-old(root) {
  animation: vt-recede 780ms cubic-bezier(0.7, 0, 0.2, 1) both;
}
::view-transition-new(root) {
  animation: vt-stamp 780ms linear both;
  mask-image:
    var(--shape),
    radial-gradient(
      circle at var(--vt-x, 50vw) var(--vt-y, 50vh),
      #000 var(--vt-reach),
      transparent calc(var(--vt-reach) + 1px)
    );
  mask-repeat: no-repeat;
}
@property --vt-reach {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}
@keyframes vt-recede {
  to {
    scale: 0.97;
    filter: brightness(0.7);
  }
}
/* mask-size is in viewport units: 30vmax is 30% of the larger side, not 3000px.
   Positions must be absolute (px or vw/vh): a percentage is relative to the free
   space, which is negative for a mask larger than the page. */
@keyframes vt-stamp {
  from {
    --vt-reach: 0px;
    mask-size:
      0 0,
      100% 100%;
    mask-position:
      var(--vt-x) var(--vt-y),
      0 0;
  }
  30% {
    --vt-reach: 0px;
    mask-size:
      30vmax 30vmax,
      100% 100%;
    mask-position:
      calc(var(--vt-x) - 15vmax) calc(var(--vt-y) - 15vmax),
      0 0;
  }
  46% {
    --vt-reach: 0px;
    mask-size:
      34vmax 34vmax,
      100% 100%;
    mask-position:
      calc(var(--vt-x) - 17vmax) calc(var(--vt-y) - 17vmax),
      0 0;
  }
  to {
    --vt-reach: 160vmax;
    mask-size:
      260vmax 260vmax,
      100% 100%;
    mask-position:
      calc(var(--vt-x) - 130vmax) calc(var(--vt-y) - 130vmax),
      0 0;
  }
}
```

Set `--shape` to `url("data:image/svg+xml,...")` with an SVG of your shape, and set
`--vt-x` and `--vt-y` in pixels from the click (`pointerdown`) or from a fixed spot.
The second mask layer, a growing circle, guarantees the page is fully revealed after
the shape leaves the screen. A very large mask costs memory on low-end phones: keep
the final size as small as the flood allows.

## Animate shared elements and reordered cards

Name an element in both pages and the browser morphs it. The name must be unique in
each page state, so set it from script only on the element involved and clear it first
on every navigation. A name set permanently on a layout element also makes that element
the containing block of its fixed descendants.

```ts
document.addEventListener('astro:before-preparation', (event) => {
  document.querySelectorAll('[data-vt-named]').forEach((el) => {
    el.style.removeProperty('view-transition-name')
    delete el.dataset.vtNamed
  })
  const photo = event.sourceElement?.closest('.card')?.querySelector('img')
  if (photo) {
    photo.style.viewTransitionName = 'hero-photo'
    photo.dataset.vtNamed = ''
  }
})
```

```css
/* The destination names its own image statically. */
.profile .portrait {
  view-transition-name: hero-photo;
}
::view-transition-group(hero-photo) {
  animation-duration: 600ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
::view-transition-old(hero-photo),
::view-transition-new(hero-photo) {
  block-size: 100%;
  object-fit: cover;
}
```

Going back works the same way if the card exists in the new document when
`astro:after-swap` fires. Content restored asynchronously after the swap cannot be a
morph target; it fades in instead. To let the browser move cards when a filter changes
the same page, give every visible card a unique name and the same
`view-transition-class`, then tune them all with
`::view-transition-group(*.card) { animation-duration: 560ms; }`. Cards that exist in
both states glide to their new position and the rest fade.

Warm the incoming image during preparation so the morph does not start from a blank
frame: wrap `event.loader` and decode the destination image with
`new Image().decode()` before the swap.
