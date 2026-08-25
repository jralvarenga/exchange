---
name: jralv-design
description: Rules on how the agent should design the frontend.
---

This are my basic rules on how you shuold design frontend components, pages and features, take into account the requirements of the project and the user, if there are any organization rules, use them as the base but still apply these rules as long as it doesn't conflict with the organization rules. If there are any other design rules or design skills, use this current skill as the base and apply the relevant rules as long as it doesn't conflict with this rules.

Always read and use the bundled [frontend-design](frontend-design/SKILL.md) skill for the visual direction and the bundled [ui-ux-pro-max](ui-ux-pro-max/SKILL.md) skill for UI, UX, accessibility and implementation rules. Use this current skill as the base if any rule conflicts.

## Design direction

Have a clear vision of the product, for who it is and what the purpose of the task/feature/page is.
Always avoid default design and generic trends unless are required by the organization, project or the user has requested it,.
Choose one distinctive signature element or aesthetic and keep the rest of the interface restrained so the signature remains memorable.

## Colors

Check theme source code and make sure this tokens are defined at leaast:

- background
- foreground
- primary
- card
- card-foreground
- muted
- muted-foreground
- success
- warning
- danger

success and primary can and should be the same color unless the design requires a different color or the user has requested it.
Never place hex colors in the code, always use the tokens.
Always have a light and dark mode for the colors and do not use color as the only way to communicate meaning or status
Avoid default gradient-heavy palettes unless the product direction requires them or the user has requested it.
Dont add any heavy border colors unless the design requires it or the user has requested it, in that case it should be at leats 10-20 % brighter than the muted, in dark should be brighter than the muted.

## Typography

Typography should be part of the product identity and should be consistent across the entire product.
Assign fonts for display, body and utility roles, in most cases display and bbody should be the same unless the design requires a different font for the display.
Base font size should be 16 px and prioritize the use of the body font (16px), avoid using small text unless is required or the user has requested it.
Use characterful display typography with restraint
NEVER BUT NEVER use all caps and a wide track for anything, unless the user requires it and always ask before applying.
For font weight, use base, bold and medium, never use semibold or black.

## Layout

Layout should be based on the product direction and should be consistent across the entire product.
Always design for mobile first and then for desktip, unless the product or feature is more for a larger display.
Prevent horizontal scrolling except on navbars, navbar should have a good ux to prevent showing the scrollbar.
Use asymmetry only when it improves the direction or hierarchy
Keep one master layout system with page-specific exceptions when necessary, inside this layout if the product requires it, place the sidebar.
Always prioritize flex box and grid for layouts, flex first, grid second. Treat structural elements as information, not decoration

## Components

Read [code-guidelines](../code-guidelines/SKILL.md) for more information on how to write components.

Always build components that are reusable and can be used in other parts of the product, avoid building components that are specific to a single page or feature unless is completely necessary.
Keep states and behavior consistent across similar components
Include default, hover, focus, active, disabled, loading, error, and success states
Make interactive components visually distinguishable from static content
Keep each component focused on one clear responsibility, dont add abstractions or derivations of the same component unless is required and the user has requested it.

## Design process

Extract the product type, audience, context, style, and platform first.
Define the palette, typography, spacing, layout, and signature element before coding.
Sketch or wireframe competing layout directions.
Critique whether the direction is specific to the product.
Replace anything that looks reusable across unrelated products.
Build from the selected system instead of making visual decisions component by component.
Review screenshots during implementation.
Remove one unnecessary decorative element before delivery