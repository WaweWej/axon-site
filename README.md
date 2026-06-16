# AXON

A generative WebGL marketing site for an AI consultancy, plus a downloadable resource **Library**. No framework, no build step for the main page; the Library uses a tiny dependency free Node generator.

## Run locally

```bash
node server.cjs
# open http://localhost:8080
```

## What's here

- **`index.html`** — the main site: a real time Three.js neural network background, scroll driven narrative (Audit, Deploy, Upskill), cursor magnetism, binary buttons, a floating template gallery, and a qualifying survey **wizard** that captures leads.
- **`library/`** — the resource hub.
  - `posts/*.md` — each resource as Markdown + frontmatter
  - `library.css`, `axon.js` — shared atmosphere (same network, cursor, smooth scroll)
  - `build.cjs` — generates `library/index.html` and a page per resource
  - `files/` — the downloadable assets (placeholder PDFs are generated when missing)

## Add a Library resource

1. Drop a PDF in `library/files/your-slug.pdf`
2. Create `library/posts/your-slug.md` with frontmatter:
   ```yaml
   ---
   title: Your Resource
   type: Guide        # Guide | Template | Checklist | Playbook
   summary: One sentence on the value.
   format: PDF
   pages: 10
   level: All levels
   file: files/your-slug.pdf
   gated: true        # email capture before download
   featured: false
   date: 2026-06-16
   ---
   Markdown body (What's inside, Who it's for, ...)
   ```
3. Rebuild:
   ```bash
   node library/build.cjs
   ```

## Lead capture

The wizard and gated downloads are wired to [Web3Forms](https://web3forms.com). Paste an access key into `WEB3FORMS_KEY` (in `index.html` for the wizard, `library/axon.js` for downloads) to receive submissions by email.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
