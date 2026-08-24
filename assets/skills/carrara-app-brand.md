---
name: carrara-app-brand
description: >
  Carrara's brand system as build rules for anything with a screen: landing pages, microsites,
  internal tools, dashboards, prototypes and vibe-coded apps. Trigger on any request to build,
  design, prototype or restyle a web page, app or artifact for Carrara or under the Carrara
  brand, including "build a landing page for us", "make an internal tool", "prototype this",
  "put our brand on it", "make it look Carrara". Also trigger when reviewing whether a built
  page is on brand. For documents and decks use carrara-brand instead; this is the screen half.
---

# Carrara app brand

Everything below is the real system, taken from the Brand Vault and from the CSS that ships on
the onboarding hub. Use the exact values. Do not substitute a colour because it looks close.

---

## Non-negotiables

Ordered by how quickly a person clocks that something is off brand.

1. **Ember is a signature, not a theme.** One accent per screen. Links, one live stat, a
   focused state. Never a full-width Ember hero, never Ember body text.
2. **Portrait for display, Manrope for everything else.** Never set body copy in a serif,
   never set a hero in Manrope.
3. **Chamfered corners, never rounded.** Carrara cuts corners off. It does not round them.
   `border-radius` above 2px is wrong.
4. **Off-white ground, not pure grey.** The canvas is warm white with grain over it.
5. **Hairlines, not filled boxes.** Separate with a 1px rule at 14% ink. Reach for a card
   border before a background fill.
6. **No emojis. No em dashes.** In UI copy, in comments, anywhere a person will read it.

---

## Tokens

Paste this block in as-is.

```css
:root {
  /* ground and ink */
  --canvas:   #FFFFFF;              /* grainy white, always with the noise overlay */
  --marmol:   #EDEBEA;              /* card and block fill */
  --ink:      #2D2A2A;              /* Grafite, all primary text */
  --ardesia:  #59534F;              /* secondary text */
  --nuvola:   #9A938E;              /* labels, captions, muted */
  --hairline: rgba(45, 42, 42, 0.14);

  /* signature */
  --ember:    #EB4E19;

  /* secondary, for events, merch, campaigns and data. Sparingly. */
  --cielo:    #B2CDED;
  --moss:     #A2C59B;
  --lavender: #9F73AB;
  --lemon:    #FFFF80;

  /* type */
  --serif: 'Portrait', 'PT Serif', Georgia, serif;
  --sans:  'Manrope', 'Helvetica Neue', Arial, sans-serif;

  /* the corner cut that makes it Carrara */
  --chamfer: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  --rock: polygon(0 14%, 10% 0, 86% 0, 100% 12%, 100% 84%, 88% 100%, 6% 100%, 0 90%);
}
```

Portrait is licensed. If the build cannot load it, fall back to PT Serif and say so rather
than silently swapping in another serif.

---

## Type scale

| Role | Family | Size | Tracking | Leading |
|---|---|---|---|---|
| Display | Portrait 500 | `clamp(34px, 4.2vw, 56px)` | `-0.02em` | 1.1 |
| Section head | Portrait 500 | `clamp(21px, 2.2vw, 28px)` | `-0.015em` | 1.15 |
| Body | Manrope 400 | 16px | normal, `word-spacing: 0.06em` | 1.8 |
| Label / eyebrow | Manrope 500 | 9.5px to 12px | `0.13em`, uppercase | 1.4 |

Display type is tight and left-aligned. Body type is open and generous. That contrast is the
whole voice: something carved next to something easy to read.

Never centre a hero. Never justify.

---

## Layout

- **Prose runs the full width of its column.** Do not cap the measure at 60 to 70 characters.
  The column padding sets the line length.
- **Whitespace does the work.** When something feels cramped, add space before you add a
  border, a background or a divider.
- **Break up any paragraph over about three lines** into a lead sentence plus bullets, or into
  named sub-points. A wall of text is the most common way a Carrara page goes wrong.
- **One idea per block.** A label above, the fact below, a hairline between.

---

## Components

**Card.** 1px hairline border, `clip-path: var(--chamfer)`, 14 to 26px padding, canvas or
Marmol fill. Border goes Ember on hover if it is clickable.

**Button, primary.** Ink fill, canvas text, chamfered, no radius, no shadow, no gradient.

**Link.** Ember text with a 1px underline at 35% Ember. Full Ember on hover. Never a default
blue underline, and never an anchor that inherits browser styling by accident.

**Label.** Uppercase Manrope at 9.5px, `letter-spacing: 0.13em`, Nuvola. Bracketed lowercase
(`[the team]`, `[before your first 1:1]`) is the house move for section eyebrows.

**Stat row.** Numbers in Portrait at display size, label in Manrope underneath, separated by
hairlines rather than boxed in cards.

**Image.** Grayscale or duotone against Cielo for portraits. Full-bleed inside its container,
1px hairline border, Marmol showing through while it loads.

---

## Texture

A subtle noise overlay sits over the canvas and over large colour fields. It is what keeps the
white from reading as flat digital white. Apply it at low opacity across the page ground, not
per component.

Colour blocks with angular cuts, derived from the logo architecture, work as standalone
graphics, image containers or framing devices. The `--rock` polygon is the irregular version
for feature blocks.

---

## Colour placement

When several blocks sit next to each other, **no two touching blocks share a colour.** Repeat a
colour only where the blocks never share an edge. This applies to card grids, dashboards and
any tiled layout.

Default order of reach: Marmol, then Cielo, then Moss, then Lemon, then Lavender. Ember only
where you want the eye to land.

---

## Before you call it done

- Is there exactly one Ember moment on the screen?
- Are all corners chamfered rather than rounded?
- Is any body copy set in a serif?
- Does any paragraph run longer than three lines without a break?
- Does any text stop mid-column while empty space sits to its right?
- Do two touching blocks share a colour?
- Any emoji, any em dash?

---

## Where the source lives

The full Brand Vault, including logo files, the photography library and the AI image prompts,
is in the Branding section of the onboarding hub. Logo source files (PNG and SVG) and the
colour blocks are on Drive, linked from inside each vault card.
