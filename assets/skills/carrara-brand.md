---
name: carrara-brand
description: >
  Enforces Carrara brand guidelines for documents (.docx) and presentations (.pptx). Trigger whenever you are asked to write, draft, create, or format any doc or deck for Carrara or a client, including memos, reports, updates, rolling docs, proposals, briefs, presentations, or pitch decks. Also trigger for "write this up", "make a doc", "make a deck", "draft a memo", or any reference to producing a document or deck. Use alongside the docx or pptx skill.
---

# Carrara Brand Skill

Write clear, structured consulting documents and presentations for Carrara, following the exact brand system.

---

## Workflow

1. **Identify document type** from context — rolling doc, internal update, client report, strategy memo, or proposal
2. **Determine brand level** — Full Brand (external proposals/pitches, copy-paste only) or Minimal Brand (everything else, .docx supported)
3. **Gather inputs** — pull from conversation context, raw notes, Slack messages, or whatever you are given
4. **Draft in markdown** — show the content using `#`, `##`, `###` so heading hierarchy is visible in chat. Never use labels like `[H1]` or `[H2]` in the output.
5. **Iterate until approved**
6. **Deliver in the right format:**
   - **Copy-paste** → deliver draft + link to the correct Google Doc template
   - **.docx** → generate branded Word file using the base script and the docx skill (Minimal Brand only)

---

## Brand Levels

| Level | When to use | .docx support |
|-------|-------------|---------------|
| **Full Brand** | External: proposals, client pitches | No — copy-paste only |
| **Minimal Brand** | Internal + semi-external: reports, memos, strategy docs, rolling docs, updates | Yes |

---

## Google Doc Template Links

When delivering via copy-paste, always include the specific template link for the document type:

| Document type | Template link |
|---------------|---------------|
| Proposal | https://docs.google.com/document/d/1B1Ra5j_4esdXR2Ude0u2W-HKuKv-fR7JGGMHBRp4-xs/edit |
| Client Report | https://docs.google.com/document/d/1AG-oEsfRysOvNy-bZp39XGb3G1XHVLomGQEhzFTLlpQ/edit |
| Internal Update / Status Report | https://docs.google.com/document/d/1wzwAdNBv4JszajiF-LR9qhX5WkEvG8y494d4YdlR0mM/edit |
| Rolling Doc | https://docs.google.com/document/d/1R1FK-DAbRRfGlC_nMIg4_u1UR0IwdtBPDRCJPQRnfoo/edit |
| Strategy Memo | https://docs.google.com/document/d/1Ed0EpmkW88pcU3n5T0wJ-7L0a7xEL46OAaJ2jFLBA2Q/edit |
| Generic / other | https://docs.google.com/document/d/17ktKUgv3npLarXff9fSULlc7OFxuCR8VfUzaL-Xqyxs/edit |

---

## Copy-Paste Delivery

After the draft is approved:

> **Ready to paste:**
> 1. Open the template: [specific link]
> 2. File → Make a copy
> 3. Replace placeholder content with the draft below
> 4. Apply heading styles from the template (H1, H2, H3, Body)
>
> *Shortcuts: ⌘⌥1 = H1, ⌘⌥2 = H2, ⌘⌥3 = H3, ⌘⌥0 = Normal*

---

## .docx Generation (Minimal Brand only)

Use the docx skill for the mechanics of file creation. The base script below defines Carrara's exact brand system — colors, fonts, spacing, tables, and footer. Adapt only the content section while preserving all style definitions exactly.

### Steps
1. `npm install -g docx`
2. Write adapted script to working directory
3. Run with `node`
4. Validate with the docx skill's validate script
5. Copy to outputs folder

### Brand Constants (Figma design tokens)

```
EMBER    = "eb4e19"    (Ember — accent, borders, quotes)
GRAFITE  = "2d2a2a"    (Grafite — dark text, table headers)
DARK     = "0e0e0e"    (primary body text — near-black)
ARDESIA  = "59534f"    (Ardesia — subtitle text)
NUVOLA   = "9a938e"    (Nuvola — tertiary text, KV borders)
MARMOL   = "edebea"    (Marmol — tint, alternating table rows)
WHITE    = "ffffff"    (White — backgrounds, inverse text)

Divider palette (decks only):
LEMON    = "ffff80"
LAVENDER = "9f73ab"
MOSS     = "a2c59b"
CIELO    = "b2cded"
```

### Typography

| Element | Font | Size (half-pts) | Weight | Color |
|---------|------|-----------------|--------|-------|
| Title | PT Serif | 64 | Bold | DARK |
| Subtitle | Manrope | 28 | Normal | SUBTITLE |
| H1 | PT Serif | 48 | Bold | DARK, green highlight (Moss #A2C59B run-level shading, not paragraph shading) |
| H2 | PT Serif | 40 | Bold | DARK |
| H3 | Monroe | 32 | Normal | DARK |
| H4 | Monroe | 22 | Bold, UPPERCASE | DARK, green highlight (Moss #A2C59B run-level shading, not paragraph shading) |
| Body | Manrope Medium | 22 | Normal | DARK |
| Bullet | Manrope Medium | 22 | Normal | DARK |
| Table header | PT Serif | 26 | Normal | White on #2d2a2a |
| Footer | Manrope | 18 | Normal | GRAY |

### Page Setup
- US Letter (12240 x 15840 DXA)
- Margins: top 1170, bottom 1440, left 1440, right 1440
- Content width: 9360 DXA (12240 minus 1440 x 2)
- Header: empty (first page has no footer either)
- Footer (default pages): "Carrara.is" left-aligned between orange top and bottom borders. Always use this simple footer on every document. No additional fields (location, contact, page numbers).
- **Cover page rule**: The first page of every document is reserved exclusively for the cover block (title, subtitle, date, contact). No body text, headings, or other content should appear on the first page. Insert a page break immediately after the cover block so all content begins on page 2. This matches the Carrara template where the cover page has the logo and quarry photo with no other text.
- **Cover and closing page images**: If the skill has an `assets/` folder containing `cover.png` and `logo.png`, embed the cover image as a full-width background at the top of the first page (before the cover block text), and embed the logo on the closing "Thank you" page. If the assets are not present, generate the doc without images and note this to the user. The quarry photo and white Carrara logo are the signature visual elements of the brand.

### Base Script

```javascript
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, HeadingLevel
} = require('docx');
const fs = require('fs');

const ORANGE   = "eb4e19";  // Ember
const GRAFITE  = "2d2a2a";  // Grafite (table headers, dark fills)
const DARK     = "0e0e0e";  // Near-black (body text)
const SUBTITLE = "59534f";  // Ardesia
const NUVOLA   = "9a938e";  // Nuvola (KV borders, tertiary)
const TINT     = "edebea";  // Marmol
const GRAY     = "999999";  // Footer text
const MOSS     = "a2c59b";  // Moss (green highlight for H1, H4)

const PAGE_W    = 12240;
const PAGE_H    = 15840;
const M_TOP     = 1170;
const M_BOTTOM  = 1440;
const M_SIDE    = 1440;
const CONTENT_W = PAGE_W - M_SIDE * 2; // 9360
const COL_W3    = Math.floor(CONTENT_W / 3);

const ob = { style: BorderStyle.SINGLE, size: 8, color: ORANGE };
const nb = { style: BorderStyle.NONE, size: 0, color: "auto" };

// ─── NAMED HEADING STYLES ────────────────────────────────────────
// These register real Word heading styles so the document outline,
// navigation pane, and Table of Contents work correctly.
// Without these, headings look right visually but don't appear in
// the Word nav pane or generate a proper document structure.
const styles = {
  default: {
    document: {
      run: { font: "Manrope Medium", size: 22, color: DARK },
      paragraph: { spacing: { after: 200, line: 276, lineRule: "auto" } }
    }
  },
  paragraphStyles: [
    {
      id: "Title",
      name: "Title",
      basedOn: "Normal",
      next: "Normal",
      run: { font: "PT Serif", size: 64, bold: true, color: DARK },
      paragraph: { spacing: { before: 0, after: 100 } }
    },
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      run: { font: "PT Serif", size: 48, bold: true, color: DARK, shading: { type: ShadingType.CLEAR, fill: MOSS, color: "auto" } },
      paragraph: { spacing: { before: 400, after: 120, line: 276, lineRule: "auto" } }
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      run: { font: "PT Serif", size: 40, bold: true, color: DARK },
      paragraph: { spacing: { before: 360, after: 120, line: 276, lineRule: "auto" } }
    },
    {
      id: "Heading3",
      name: "Heading 3",
      basedOn: "Normal",
      next: "Normal",
      run: { font: "Monroe", size: 32, color: DARK },
      paragraph: { spacing: { before: 320, after: 80, line: 276, lineRule: "auto" } }
    },
    {
      id: "Heading4",
      name: "Heading 4",
      basedOn: "Normal",
      next: "Normal",
      run: { font: "Monroe", size: 22, bold: true, color: DARK, allCaps: true, shading: { type: ShadingType.CLEAR, fill: MOSS, color: "auto" } },
      paragraph: { spacing: { before: 280, after: 80 } }
    },
  ]
};

// ─── COVER BLOCK (paragraphs + HR dividers, mobile-safe) ─────────
// Uses paragraph borders instead of a table so the cover section
// renders correctly on mobile devices and doesn't truncate.
// Returns an array of paragraphs — spread into the children array.
function coverBlock(title, sub, date, contact) {
  return [
    // Title with orange top border
    new Paragraph({
      spacing: { before: 0, after: 100 },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE } },
      children: [new TextRun({ text: title, font: "PT Serif", size: 64, bold: true, color: DARK })]
    }),
    // Subtitle with orange bottom border
    new Paragraph({
      spacing: { before: 0, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ORANGE } },
      children: [new TextRun({ text: sub, font: "Manrope", size: 22, color: SUBTITLE })]
    }),
    // Date with orange top + bottom borders
    new Paragraph({
      spacing: { before: 100, after: 100 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: ORANGE }
      },
      children: [new TextRun({ text: date, font: "Manrope", size: 22, bold: true, color: DARK })]
    }),
    // Contact with orange top + bottom borders
    new Paragraph({
      spacing: { before: 100, after: 100 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: ORANGE }
      },
      children: [new TextRun({ text: contact, font: "Manrope", size: 22, bold: true, color: DARK })]
    }),
  ];
}

// ─── TEXT HELPERS (using named heading styles) ───────────────────
// These use HeadingLevel so headings appear in the Word document
// outline / navigation pane and support Table of Contents generation.
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t })] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: "Monroe" })] });
const h4 = t => new Paragraph({ heading: HeadingLevel.HEADING_4, children: [new TextRun({ text: t, font: "Monroe" })] });
const body = (t, opts={}) => new Paragraph({ spacing: { after: 200, line: 276, lineRule: "auto" }, children: [new TextRun({ text: t, font: "Manrope Medium", size: 22, color: DARK, bold: opts.bold||false, italics: opts.italic||false })] });
const bullet = (t, opts={}) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 0, line: 240, lineRule: "auto" }, children: [new TextRun({ text: t, font: "Manrope Medium", size: 22, color: DARK, bold: opts.bold||false })] });
// Sub-bullet for the "bold title + explanation" pattern. Use bullet() with bold:true for the title row, then subBullet() for the explanation row.
const subBullet = t => new Paragraph({ numbering: { reference: "bullets", level: 1 }, spacing: { after: 0, line: 240, lineRule: "auto" }, children: [new TextRun({ text: t, font: "Manrope Medium", size: 22, color: DARK })] });
const empty = () => new Paragraph({ spacing: { after: 200 }, children: [] });

// ─── DATA TABLE (dark header, alternating rows) ──────────────────
function dataTable(headers, rows) {
  const colW = Math.floor(CONTENT_W / headers.length);
  const headerRow = new TableRow({ children: headers.map(h => new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, shading: { type: ShadingType.CLEAR, fill: "2d2a2a", color: "auto" }, margins: { top: 144, bottom: 144, left: 144, right: 144 }, width: { size: colW, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 0, line: 240, lineRule: "auto" }, children: [new TextRun({ text: h, font: "PT Serif", size: 26, color: "ffffff" })] })] })) });
  const dataRows = rows.map((row, i) => new TableRow({ children: row.map((cell, j) => new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "auto" : TINT, color: "auto" }, margins: { top: 144, bottom: 144, left: 144, right: 144 }, width: { size: colW, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 0, line: 240, lineRule: "auto" }, children: [new TextRun({ text: cell, font: j===0?"Manrope":"Manrope Medium", size: 22, bold: j===0, color: DARK })] })] })) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: headers.map(() => colW), rows: [headerRow, ...dataRows] });
}

// ─── KV TABLE (2-col, gray borders, for proposals/role tables) ───
function kvTable(rows) {
  const lw = 2085, vw = CONTENT_W - lw;
  const gb = { style: BorderStyle.SINGLE, size: 8, color: "9a938e" };
  const borders = { top: gb, bottom: gb, left: nb, right: nb };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [lw, vw],
    rows: rows.map(([l, v]) => new TableRow({ children: [
      new TableCell({ borders, margins: { top: 80, bottom: 80, left: 100, right: 100 }, width: { size: lw, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 80, before: 80, line: 240, lineRule: "auto" }, children: [new TextRun({ text: l, font: "Manrope", size: 22, bold: true, color: DARK })] })] }),
      new TableCell({ borders, margins: { top: 80, bottom: 80, left: 100, right: 100 }, width: { size: vw, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: v, font: "Manrope Medium", size: 22, color: DARK })] })] }),
    ]}))
  });
}

// ─── QUOTE (left orange border, italic PT Serif) ─────────────────
function quote(text) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    borders: { top: nb, bottom: nb, left: ob, right: nb, insideH: nb, insideV: nb },
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: nb, bottom: nb, left: ob, right: nb },
      margins: { top: 144, bottom: 144, left: 144, right: 144 },
      width: { size: CONTENT_W, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, font: "PT Serif", size: 36, italics: true, color: ORANGE })] })]
    })] })]
  });
}

// ─── HEADER & FOOTER ─────────────────────────────────────────────
const docHeader = new Header({ children: [new Paragraph({ spacing: { after: 0 }, children: [] })] });
const firstPageFooter = new Footer({ children: [new Paragraph({ spacing: { after: 0 }, children: [] })] });
const docFooter = new Footer({ children: [new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
  borders: { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb },
  rows: [new TableRow({ children: [
    new TableCell({
      borders: { top: ob, bottom: ob, left: nb, right: nb },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      width: { size: CONTENT_W, type: WidthType.DXA },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 0, before: 0, line: 240, lineRule: "auto" },
        children: [new TextRun({ text: "Carrara.is", font: "Manrope", size: 18, color: GRAY })]
      })]
    }),
  ]})]
})] });

const numbering = { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\uF0B7", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Symbol" } } },
  { level: 1, format: LevelFormat.BULLET, text: "o", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } }, run: { font: "Courier New" } } },
] }] };
const pageSetup = {
  properties: {
    page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: M_TOP, right: M_SIDE, bottom: M_BOTTOM, left: M_SIDE } },
    titlePage: true
  },
  headers: { default: docHeader, first: docHeader },
  footers: { default: docFooter, first: firstPageFooter }
};

// ─── CONTENT — replace this section ──────────────────────────────
// NOTE: coverBlock() returns an array, so use the spread operator (...).
// NOTE: styles is passed to the Document constructor for named heading support.
// IMPORTANT: The cover page (first page) contains ONLY the coverBlock elements.
// All body content starts on a new second page using a page break.
// The cover page should feel like a title page — no body text, no headings.
const doc = new Document({ styles, numbering, sections: [{ ...pageSetup, children: [

  ...coverBlock(
    "Document Title",
    "Subtitle",
    "March 2026",
    "Contact: Name"
  ),

  // Page break — everything below appears on page 2+
  // The first page is reserved exclusively for the cover block above.
  new Paragraph({ pageBreakBefore: true, children: [] }),

  // Build content here using h1(), h2(), h3(), h4(), body(), bullet(),
  // dataTable(), kvTable(), quote(), empty()

]}] });

Packer.toBuffer(doc).then(b => { fs.writeFileSync("output.docx", b); console.log("Done."); });
```

---

## Heading Hierarchy by Document Type

These heading levels match the Carrara templates exactly. Using the wrong level breaks the visual hierarchy.

### Internal Update / Status Report
- Cover: Title + Subtitle + Date + Contact (coverBlock, spread with `...`)
- Main sections (Progress, Blockers/Risks, Next Steps): **H2**
- Sub-sections (workstream names): **H3**
- Body text, tables: body(), dataTable()

### Rolling Doc
- Cover: Title + Subtitle + Date + Contact (coverBlock, spread with `...`)
- Check-in dates: **H2**
- Topics within each check-in: **H3**
- Broad Ownership, Next Steps: **H2**
- Ownership table: dataTable()

### Client Report / Deliverable
- Cover: Title + Subtitle + Date + Contact (coverBlock, spread with `...`)
- Top-level section (e.g. "Acme Corp: Brand Audit"): **H1**
- Major sections (Context, Methodology, Findings, Recommendations, Next Steps): **H2**
- Sub-sections within findings: **H3**
- Data tables: dataTable()

### Strategy Memo / Options Doc
- Cover: Title + Subtitle + Date + Contact (coverBlock, spread with `...`)
- Top-level section ("Client: Topic Memo"): **H1**
- Major sections (Context, Tensions): **H2**
- Path titles (Path 1, Path 2, Path 3): **H1**
- Sub-sections within paths (Positioning, Risk): **H2**
- Sub-sub-sections (Why this plays to strengths, What we're saying no to): **H3**
- Closing quote: quote()

### Proposal (Full Brand — copy-paste only)
- Cover: Title + Subtitle + Date + Contact (coverBlock, spread with `...`)
- Sections (What is Carrara, Proposed Scope, Next Steps): **H1**
- Scope/pricing details: kvTable()
- Closing quote: centered italic

### Thank You Closing Page (all doc types)

Every Carrara document ends with a "Thank you" page. This is the final page of the document, after all content.

- A page break separates the content from the thank you page
- The page contains only two elements, vertically centered:
  1. **"Thank you"** in PT Serif, 64 half-pts, bold, color DARK, center-aligned
  2. **"carrara.is"** in Manrope, 22 half-pts, normal weight, color GRAY, center-aligned, directly below

In the base script, add this at the end of the children array (before the closing `]}]`):

```javascript
// ─── THANK YOU PAGE ─────────────────────────────────────────────
new Paragraph({ pageBreakBefore: true, spacing: { before: 4000, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Thank you", font: "PT Serif", size: 64, bold: true, color: DARK })] }),
new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "carrara.is", font: "Manrope", size: 22, color: GRAY })] }),
```

For copy-paste delivery, add a final page with "Thank you" centered and "carrara.is" below it.

---

## Writing Style

### Voice by Document Type

| Type | Tone | Formality |
|------|------|-----------|
| Rolling docs | Direct, conversational, WIP | Low |
| Internal updates | Crisp, action-oriented | Medium |
| Client reports | Clear, confident, thorough | High |
| Strategy memos | Assertive, structured | High |
| Proposals | Warm, confident, aspirational | Medium-High |

### Principles

Carrara docs read like they were written by someone who thinks clearly and respects the reader's time. That means:

- **Direct assertions** — no hedging with "we believe" or "it seems like". Say what's true.
- **Active voice always** — "We recommend X" not "It is recommended that X"
- **Short sentences for key points** — let important ideas breathe on their own line
- **Bold** key terms and names on first mention
- *Italics* for caveats and side notes
- Never use dashes between words (em dashes). Use periods or restructure the sentence.

### Bullet Patterns

When a bulleted list follows the pattern of **bold title + explanation of that title**, the explanation must be rendered as an indented sub-bullet beneath the title bullet, never inline with it. This is the standard Carrara list pattern for deliverables, scope items, role cards, and any list where each item has a name and a description.

**Correct structure (always use this):**

- **Career page v2.**
  - Full website with expanded content, narrative integration, and a richer set of role-specific surfaces.
- **Engineering mini-website.**
  - Dedicated engineering landing page showcasing team, tech stack, AI work, and open roles.

**Incorrect structure (never use):**

- **Career page v2.** Full website with expanded content, narrative integration, and a richer set of role-specific surfaces.
- **Engineering mini-website.** Dedicated engineering landing page showcasing team, tech stack, AI work, and open roles.

Rules:

- The parent bullet contains only the bold title, ending with a period.
- The sub-bullet contains the explanation as a complete sentence.
- If a single item has multiple supporting points, use multiple sub-bullets under the same parent.
- This applies in both .docx output and copy-paste markdown drafts.
- In the .docx script, use `bullet()` for the title row and `subBullet()` for the explanation row. The numbering config registers level 0 (parent) and level 1 (child) so this renders cleanly in Word.

### Signature Framing Patterns

These patterns are what make a Carrara doc feel like a Carrara doc. Use them when they fit naturally:

- "Strategic bet: We won't be X, but we'll be Y"
- "Why this plays to [Client]'s strengths:"
- "What we're explicitly saying no to:"
- "This path is wrong if:"
- "If this doesn't work, it's because:"
- "Implications:"

### Status Indicators

Use these consistently across all document types:

- ✅ Complete
- 🟢 On track
- 🟡 Needs attention
- 🔴 Blocked
- ~~text~~ Done / Parked

### Content Philosophy

Every Carrara doc answers three questions: **What's happening? So what? Now what?**

- Clarity over completeness. Say less, say it clearly.
- Bias toward action. End with concrete next steps and owners.
- No filler paragraphs. If a section doesn't earn its place, cut it.

---
---

# Part 2: Presentations (.pptx)

Carrara decks are built by **editing the master template**, not from scratch. The templates contain complex layouts with quarry photos, the Carrara logo, shaped content cards, and colored backgrounds that cannot be reliably reproduced with pptxgenjs.

## Workflow for Decks

1. **Copy the master template** from `assets/master-generic.pptx` to a working directory
2. **Unpack** using the pptx skill's unpack script
3. **Duplicate the slide layouts you need**, delete the ones you don't
4. **Edit slide XML** to replace placeholder content
5. **Run overflow check** on every content slide (see "Text Overflow Detection and Slide Splitting" below)
6. **If any slide overflows**, duplicate it and split content across the original and continuation slide
7. **Pack** back into a .pptx file
8. **QA** by converting to images and inspecting visually, confirming no text is cut off

Always use the pptx skill's editing.md guide for the mechanics of unpacking, editing XML, and repacking.

## Deck Brand System

### Colors (Figma design system tokens)

#### Core palette

| Token name | Hex | Usage |
|------------|-----|-------|
| **Ember** | `EB4E19` | Primary accent: titles on cover, date pill, orange cards, quote text, orange labels |
| **Grafite** | `2D2A2A` | Dark text, dark cards, dark divider backgrounds |
| **Marmol** | `EDEBEA` | Slide outer margin area, alternating table rows, light tint |
| **Ardesia** | `59534F` | Subtitle text, secondary text |
| **Nuvola** | `9A938E` | Tertiary text, borders on KV tables |
| **White** | `FFFFFF` | Content area background, text on dark slides |

#### Divider slide colors

| Token name | Hex | Usage |
|------------|-----|-------|
| **Lemon** | `FFFF80` | Divider slide background (dark text) |
| **Lavender** | `9F73AB` | Divider slide background (white text) |
| **Moss** | `A2C59B` | Divider slide background (dark text) |
| **Cielo** | `B2CDED` | Divider slide background (dark text) |
| **Grafite** | `2D2A2A` | Divider slide background (white text) |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Slide title | PT Serif | 36-44pt | Bold |
| Section header | PT Serif | 20-24pt | Bold |
| Body text | Manrope Medium | 14pt | Normal |
| Card title | Manrope Medium | 14-16pt | Bold |
| Card body | Manrope Medium | 12-14pt | Normal |
| Labels (Project, Date, Contact) | Manrope Medium | ~10pt | Bold, orange color |
| Footer | Manrope Medium | ~8pt | Normal |
| Quote/statement text | PT Serif | 48-72pt | Bold, orange |

### Slide Size
- 16:9 widescreen (10" x 5.625")
- EMU: cx=9144000, cy=5143500

### Footer
- "carrara.is" bottom-left on content slides, small gray text. Always use this simple footer. Do not add location or contact fields to the footer.

## Slide Types in the Template

The MASTER Generic.pptx contains these slide layouts. When building a deck, pick the ones that fit the content:

### 1. Cover Slides (slides 2-3)
Full-bleed quarry photograph background. White Carrara logo anchored at bottom. Title top-left in white bold PT Serif. Date in an orange pill/rectangle.
Two variants: different quarry photos.

### 2. Project Cover (slide 4)
Stone background. Large orange Carrara logo at bottom. Top-left has structured info: **Project:** in orange bold, then value. **Date:** in orange bold, then value. **Contact:** in orange bold, then value. Orange horizontal lines separate each field.

### 3. Agenda (slide 5)
Left third: solid orange rectangle with "Agenda" title in white bold. Right two-thirds: white background with numbered or bulleted items.

### 4. Content / Title + Body (slide 6)
White content area inset within stone border. Title bold at top-left. Body text below with normal weight.

### 5. Two Block Neutral (slide 7)
Two side-by-side light gray content cards with cut-corner shape at top-right. Each has a bold title and body text.

### 6. Two Block High Contrast (slide 8)
Left card orange background with white text. Right card dark (#2E2B2B) background with white text. Same cut-corner shape.

### 7. Three Block Neutral (slide 9)
Three light gray cards across. Each with bold title and body text.

### 8. Three Block Dark (slide 10)
Three dark cards across, white text.

### 9. Quote / Statement (slide 11)
White content area. Small title top-left. Large orange bold text (48-72pt) fills the rest of the slide. Used for impactful pull quotes.

### 10. Case Study / Detail (slide 12)
Title in large bold text. Orange subtitle (bold, smaller). Bold summary sentence below. Bullet points with details.

### 11. Split Content (slide 13)
Left half: title and structured content (labels, descriptions). Right half: dark image or solid dark rectangle.

### 12. Divider Slides (slides 14-18)
Full solid color background. Title in large bold text top-left. Small subtitle bottom-left. Five color variants: Grafite #2D2A2A (white text), Moss #A2C59B, Lemon #FFFF80, Lavender #9F73AB, Cielo #B2CDED (darker text on lighter backgrounds).

### 13. Closing Slide (slide 19)
Full-bleed quarry photograph with white Carrara logo. No text.

## Deck Editing Tips

- **Never rebuild these layouts from scratch.** The complex shapes (cut-corner cards, the Carrara logo SVG, quarry photos) live in the template. Duplicate and edit.
- **To add a slide**, copy the XML of an existing slide that uses the layout you want, renumber it, and add it to `presentation.xml` and `[Content_Types].xml`.
- **To change text**, find the `<a:t>` elements in the slide XML and replace.
- **To change card colors**, look for `<a:solidFill><a:srgbClr val="..."/></a:solidFill>` in the shape properties.
- **Divider slide colors** are set on the shape fill of a background rectangle, not the slide background itself.
- **Keep the "carrara.is" footer** on all content slides.
- **Don't mix fonts.** The deck system uses PT Serif for titles/headings and Manrope Medium for body/labels. These are the same fonts used in docs. Do not introduce other typefaces.

## Text Overflow Detection and Slide Splitting

After populating slide content, **always check for text overflow** on every slide. If text overflows, duplicate the slide and move the excess content to the continuation slide. Never let text run outside its designated area or get visually cut off.

### When to Split

A slide must be split into two (or more) slides when **either** of these conditions is true:

1. **Title overflow**: The title text extends beyond the horizontal or vertical bounds of the title placeholder. For most layouts, the title area fits roughly 60 to 80 characters on a single line at 36 to 44pt PT Serif. If the title wraps to more lines than the title placeholder height allows (typically 1 to 2 lines), it is overflowing.

2. **Body overflow (90% rule)**: The body content (all text runs, bullets, sub-elements) occupies more than **90% of the vertical space** allocated to the body placeholder. This threshold exists to preserve visual breathing room. Do not wait until text is clipped; split proactively at 90%.

### How to Estimate Overflow

Since pptx XML does not report rendered text height, estimate using these reference values:

| Font | Size (pt) | Approx line height (EMU) | Approx chars per line (content area width) |
|------|-----------|--------------------------|---------------------------------------------|
| PT Serif Bold | 40pt | 609,600 | ~50 chars |
| PT Serif Bold | 36pt | 548,600 | ~55 chars |
| Manrope Medium | 14pt | 213,360 | ~85 chars |
| Manrope Medium | 12pt | 182,880 | ~100 chars |

To check overflow:

1. Parse the slide XML and extract all `<a:t>` text from the body placeholder (`<p:sp>` with body-type `<p:ph type="body" .../>` or the second text frame).
2. Count the total number of text lines by dividing each paragraph's character count by the chars-per-line value for its font size, rounding up.
3. Multiply total lines by the line height in EMU.
4. Compare against the body placeholder's `<a:ext cy="..."/>` value. If the estimated text height exceeds **90% of cy**, the slide needs splitting.

For titles, do the same calculation against the title placeholder's cy value. If estimated title height exceeds the placeholder height, split.

### How to Split a Slide

When a slide overflows:

1. **Duplicate the slide XML file** (e.g., copy `slide6.xml` to `slide7.xml`, renumbering all subsequent slides). Also duplicate the corresponding `.xml.rels` file.
2. **Register the new slide** in `presentation.xml` (add a `<p:sldId>` entry) and in `[Content_Types].xml`.
3. **Split the content** between the two slides:
   - **Title overflow**: Keep the title as is on the first slide (let it use available space). On the continuation slide, use the same layout and set the title to the same text followed by " (cont.)". Move any body content that was displaced to the continuation slide.
   - **Body overflow**: Keep enough body content on the first slide to fill approximately 85% of the body area (leaving comfortable margin). Move the remaining paragraphs, bullets, or text blocks to the continuation slide's body placeholder. The continuation slide keeps the same title, appending " (cont.)" to signal continuation.
4. **Preserve all formatting**: The continuation slide must use the exact same slide layout, shapes, colors, footer, and fonts. Only the text content changes.
5. **Preserve slide order**: The continuation slide is inserted immediately after the original, before any subsequent slides.

### Splitting Rules for Specific Layouts

- **Content / Title + Body (slide 6 layout)**: Split body paragraphs across slides. Each slide keeps the title.
- **Two Block / Three Block layouts**: If a single card overflows, split that card's content across two copies of the same layout. Keep the other cards identical on both slides, with the overflowing card showing "(cont.)" as its card title on the second slide.
- **Quote / Statement**: These should never overflow since they contain a single short statement. If the quote is too long, shorten it instead of splitting.
- **Case Study / Detail**: Split bullet points across slides. Keep the title, subtitle, and summary sentence on the first slide only. The continuation slide gets the remaining bullets under the same title with "(cont.)".
- **Divider slides**: These contain minimal text and should never need splitting. If a divider subtitle is too long, shorten it.

### Overflow Check in the Workflow

This check is **mandatory** and happens after editing slide XML and before packing:

1. Unpack the deck
2. Edit slide XML with content
3. **Run overflow estimation on every content slide**
4. If any slide exceeds thresholds, split it and re-register slides
5. Pack back into .pptx
6. QA by converting to images and inspecting visually, confirming no text is cut off

## Content Deck Patterns (from "What is Carrara" reference)

When building a content or pitch deck (not just a report), these patterns show how Carrara presents itself. Use these as structural references:

- **Credentials slide**: Title + bulleted list of client logos/names. Use a content slide layout.
- **Team slide**: Two or three block layout. Each card = one person with name, title, and short bio.
- **Service area slides**: Use divider slides (colored backgrounds) to introduce each service area, then content slides with details.
- **Case study slides**: Title + orange subtitle + summary sentence + bullet points. Use the Case Study layout.
- **Philosophy/values slides**: Use the Quote/Statement layout for big, bold declarations.
- **Process slides**: Numbered steps using the content or multi-block layouts.
- **Closing**: Always end with the quarry photo closing slide (no text, just logo).

These patterns are documented here because the full reference deck is not included in assets to keep the skill under the size limit. The editable template (`assets/master-generic.pptx`) contains all the layouts needed to build these patterns.
