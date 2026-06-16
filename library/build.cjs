/* Oplyst Library — resource hub build: posts/*.md -> index.html + <slug>.html (+ placeholder PDFs)
   Run:  node library/build.cjs                                                          */
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const POSTS = path.join(DIR, 'posts');
const FILES = path.join(DIR, 'files');
const mk = require('./vendor/marked.min.js');
const toHtml = s => { const fn = mk.marked || mk; return (typeof fn === 'function') ? fn(s) : fn.parse(s); };

const SITE = '../index.html';
const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---- frontmatter ---- */
function parse(raw){
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data:{}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')){
    const mm = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.*)\s*$/); if (!mm) continue;
    let v = mm[2].trim().replace(/^["']|["']$/g, '');
    if (v === 'true') v = true; else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
    data[mm[1]] = v;
  }
  return { data, body: m[2] };
}
const fmtDate = s => { const d = new Date(s); return isNaN(d) ? (s||'') : d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); };

/* ---- minimal placeholder PDF (only created if a real file isn't there) ---- */
function makePdf(title, sub){
  const e = s => String(s).replace(/[\\()]/g, m => '\\'+m);
  const content = `BT /F1 26 Tf 60 770 Td (${e(title)}) Tj 0 -36 Td /F1 13 Tf (${e(sub)}) Tj 0 -28 Td (Oplyst. Erstat denne midlertidige fil med den rigtige guide.) Tj ET`;
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`
  ];
  let pdf = '%PDF-1.4\n'; const off = [];
  objs.forEach((o,i) => { off.push(pdf.length); pdf += `${i+1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
  off.forEach(o => pdf += String(o).padStart(10,'0') + ' 00000 n \n');
  pdf += `trailer\n<</Size ${objs.length+1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

/* ---- shared chrome ---- */
const head = (title, desc, og, bodyClass, bodyAttr) => `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#05070d">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="${og || 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23818cf8'/%3E%3Cstop offset='1' stop-color='%23fbbf24'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='7' fill='%2305070d'/%3E%3Cpath d='M16 6 c-4 0-7.2 3-7.2 7 0 2.4 1.2 4 2.3 5.2 0.7 0.8 1.3 1.4 1.3 2.5 h7.2 c0-1.1 0.6-1.7 1.3-2.5 1.1-1.2 2.3-2.8 2.3-5.2 C23.2 9 20 6 16 6Z' fill='none' stroke='url(%23g)' stroke-width='1.7'/%3E%3Cpath d='M13 24.5 h6 M13.8 27 h4.4' stroke='url(%23g)' stroke-width='1.7' stroke-linecap='round'/%3E%3Ctext x='16' y='17.6' text-anchor='middle' font-family='monospace' font-size='8' font-weight='700' fill='url(%23g)'%3E10%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="library.css">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}${bodyAttr || ''}>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><linearGradient id="oplyst-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#fbbf24"/></linearGradient><symbol id="oplyst-mark" viewBox="0 0 32 32"><path d="M16 5 c-4.6 0-8.3 3.4-8.3 7.9 0 2.8 1.4 4.7 2.7 6.1 0.8 0.9 1.5 1.6 1.5 2.8 h8.2 c0-1.2 0.7-1.9 1.5-2.8 1.3-1.4 2.7-3.3 2.7-6.1 C24.3 8.4 20.6 5 16 5Z" fill="none" stroke="url(#oplyst-g)" stroke-width="1.7"/><path d="M12.5 24.6 h7 M13.3 27.4 h5.4" fill="none" stroke="url(#oplyst-g)" stroke-width="1.7" stroke-linecap="round"/><text x="16" y="17.4" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="8.5" font-weight="600" fill="url(#oplyst-g)">10</text></symbol></svg>
<canvas id="axon-gl" aria-hidden="true"></canvas>
<div class="amb-fade" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="cursor" id="cursor" aria-hidden="true"></div>
<div class="wrap">`;

const header = `<header class="site">
  <a class="brand" href="${SITE}"><svg class="mark" aria-hidden="true"><use href="#oplyst-mark"/></svg>Oplyst <small>/ Bibliotek</small></a>
  <nav class="site-nav">
    <a href="${SITE}">Forsiden</a>
    <a href="index.html" class="active">Bibliotek</a>
    <a href="${SITE}?wizard=1" class="nav-cta">Få en AI audit</a>
  </nav>
  <button class="menu-btn" id="menuBtn" aria-label="Åbn menu" aria-expanded="false"><span></span><span></span></button>
</header>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true">
  <nav>
    <a href="${SITE}" data-mclose>Forsiden</a>
    <a href="index.html" data-mclose>Bibliotek</a>
  </nav>
  <a href="${SITE}?wizard=1" class="btn btn-primary" data-mclose>Få en AI audit →</a>
</div>`;

const modal = `<div class="getmodal" id="getmodal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="gm-scrim" data-gmclose></div>
  <div class="gm-inner">
    <button class="gm-close" data-gmclose type="button">Close</button>
    <div class="gm-kicker" id="gm-kicker">Gratis download</div>
    <h3 id="gm-title">Hent guiden</h3>
    <div class="gm-form" id="gm-form">
      <p class="gm-sub">Fortæl os, hvor vi skal sende den. Du får downloadlinket med det samme, plus den sjældne, virkelig brugbare ressource. Ingen spam.</p>
      <div class="gm-fields">
        <input id="gm-name" type="text" placeholder="Dit navn" autocomplete="name">
        <input id="gm-email" type="email" placeholder="Arbejdsmail" autocomplete="email">
      </div>
      <div class="gm-error" id="gm-error"></div>
      <a class="btn btn-primary" id="gm-submit" role="button" tabindex="0">Send mig downloaden →</a>
    </div>
    <div class="gm-done" id="gm-done">
      <p class="gm-sub">Din download starter nu, og vi har sendt en kopi på mail. <a id="gm-direct" href="#" download>Klik her</a>, hvis den ikke går i gang.</p>
      <div class="gm-donate">
        <p>Var den nyttig? Støt vidensbanken, så den forbliver gratis for alle.</p>
        <a class="btn btn-primary" id="gm-donate" role="button" tabindex="0">Støt med MobilePay →</a>
      </div>
    </div>
  </div>
</div>`;

const footer = `</div>
${modal}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/GammaCorrectionShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="axon.js"></script>
</body></html>`;

const footerLinks = `<footer class="site"><div class="frame">
  <div class="copy">© Oplyst · AI som driftsfordel.</div>
  <div class="f-links"><a href="${SITE}">Forsiden</a><a href="index.html">Bibliotek</a><a href="${SITE}?wizard=1">Få en AI audit</a></div>
</div></footer>`;

const pagesLabel = n => n ? ` · ${n} ${n==1?'side':'sider'}` : '';

// per document-type colour (rgb triplet), matching the main site's section palette
const TYPE_RGB = { Guide:'91,140,255', Skabelon:'34,211,238', Tjekliste:'168,85,247',
  Drejebog:'245,158,11', Playbook:'245,158,11', Sammenligning:'244,86,156', Prompt:'45,212,191',
  Snydeark:'250,204,21', Ordbog:'148,163,184', Beregner:'52,211,153', Workshop:'167,139,250' };
const tcOf = p => TYPE_RGB[p.type] || '91,140,255';

const getBtn = (p, label) => p.gated
  ? `<button class="btn btn-primary" data-get data-title="${esc(p.title)}" data-type="${esc(p.type)}" data-file="${esc(p.file)}">${label} →</button>`
  : `<a class="btn btn-primary" href="${esc(p.file)}" download>${label} →</a>`;

const card = p => `<div class="card rv" data-cat="${esc(p.type)}" style="--tc:${tcOf(p)}">
  <div class="c-art"><span class="badge">${esc(p.type)}</span></div>
  <div class="c-body">
    <div class="meta-row">${esc(p.format)}${pagesLabel(p.pages)}<span class="dotsep"></span>${esc(p.level||'Alle niveauer')}</div>
    <h3><a href="${p.slug}.html">${esc(p.title)}</a></h3>
    <p>${esc(p.summary)}</p>
    <div class="c-foot">${p.gated
      ? `<button class="getlink" data-get data-title="${esc(p.title)}" data-type="${esc(p.type)}" data-file="${esc(p.file)}">Hent ${esc(p.type.toLowerCase())} →</button>`
      : `<a class="getlink" href="${esc(p.file)}" download>Download →</a>`}</div>
  </div>
</div>`;

/* ---- load resources ---- */
if (!fs.existsSync(POSTS)){ console.error('No posts/ folder at', POSTS); process.exit(1); }
if (!fs.existsSync(FILES)) fs.mkdirSync(FILES);
const posts = fs.readdirSync(POSTS).filter(f => f.endsWith('.md')).map(f => {
  const { data, body } = parse(fs.readFileSync(path.join(POSTS, f), 'utf8'));
  const slug = data.slug || f.replace(/\.md$/, '');
  return {
    slug, title: data.title || slug, type: data.type || 'Guide',
    summary: data.summary || data.excerpt || '', format: data.format || 'PDF',
    pages: data.pages || 0, level: data.level || 'Alle niveauer',
    file: data.file || ('files/' + slug + '.pdf'), gated: data.gated !== false,
    featured: !!data.featured, date: data.date || '', dateLabel: fmtDate(data.date),
    html: toHtml(body)
  };
}).sort((a,b) => new Date(b.date) - new Date(a.date));

/* generate placeholder downloads where a real file is missing */
for (const p of posts){
  const fp = path.join(DIR, p.file);
  if (!fs.existsSync(fp)){ fs.mkdirSync(path.dirname(fp), {recursive:true}); fs.writeFileSync(fp, makePdf(p.title, p.summary.slice(0,90))); }
}

/* ---- hub ---- */
const types = [...new Set(posts.map(p => p.type))];
const feat = posts.find(p => p.featured) || posts[0];
const rest = posts.filter(p => p !== feat);
const filterBtns = ['all', ...types].map((c,i) =>
  `<button class="filter${i===0?' on':''}" data-filter="${esc(c)}">${i===0?'Alle ressourcer':esc(c)}</button>`).join('');

const hub = head('Oplyst Bibliotek · gratis AI guider, skabeloner og værktøjer',
  'Gennemarbejdede guider, skabeloner og drejebøger til at få AI i arbejde. Kortlægning af arbejdsgange, tjeklister til drift og forankring i teamet, fra Oplyst.') +
header + `
<main>
  <div class="frame hub-head">
    <div class="hub-kicker rv">Biblioteket</div>
    <h1 class="rv">Gratis værktøjer, der får AI i arbejde.</h1>
    <p class="rv">Gennemtestede guider, skabeloner og drejebøger, du kan hente og bruge i dag. De samme kits, vi kører med kunderne. Vælg ét, og sæt det i arbejde i denne uge.</p>
    <div class="filters rv">${filterBtns}</div>
  </div>
  <div class="frame">
    ${feat ? `<div class="featured rv" data-cat="${esc(feat.type)}" style="--tc:${tcOf(feat)}">
      <div class="f-body">
        <div class="meta-row"><span class="type">Udvalgt · ${esc(feat.type)}</span><span class="dotsep"></span>${esc(feat.format)}${pagesLabel(feat.pages)}</div>
        <h2><a href="${feat.slug}.html">${esc(feat.title)}</a></h2>
        <p>${esc(feat.summary)}</p>
        <div class="f-actions">${getBtn(feat, 'Hent '+feat.type.toLowerCase())}<a class="ghostlink" href="${feat.slug}.html">Se mere →</a></div>
      </div>
      <div class="f-art"><span class="badge">${esc(feat.type)}</span></div>
    </div>` : ''}
    <div class="grid">
      ${rest.length ? rest.map(card).join('\n') : '<div class="empty">Flere ressourcer er på vej.</div>'}
    </div>
  </div>
  ${footerLinks}
</main>` + footer;
fs.writeFileSync(path.join(DIR, 'index.html'), hub);

/* ---- resource landing pages ---- */
for (const p of posts){
  const related = posts.filter(x => x !== p).slice(0, 3);
  const page = head(p.title + ' · Oplyst Bibliotek', p.summary, 'article', 'reading', ` data-doctype="${esc(p.type)}"`) + `
<div class="read-progress" aria-hidden="true"></div>` + header + `
<article>
  <div class="res-head frame">
    <div class="res-info rv">
      <div class="meta-row"><span class="type">${esc(p.type)}</span><span class="dotsep"></span>${esc(p.format)}${pagesLabel(p.pages)}<span class="dotsep"></span>${esc(p.level)}</div>
      <h1>${esc(p.title)}</h1>
      <p class="lede">${esc(p.summary)}</p>
      <div class="res-actions">${getBtn(p, p.gated ? 'Hent '+p.type.toLowerCase() : 'Download '+p.type.toLowerCase())}
        <span class="res-note">${p.gated ? 'Gratis · sendt med det samme' : 'Gratis · hent med det samme'}</span></div>
    </div>
    <div class="res-cover rv"><span class="badge">${esc(p.type)}</span><span class="res-format">${esc(p.format)}</span></div>
  </div>
  <div class="prose">
    ${p.html}
  </div>
  <div class="cta-card rv">
    <h3>Vil du have det kørt på din forretning?</h3>
    <p>Guiderne er gør det selv versionen. Vil du hellere have, at vi gør det sammen med jer, så start med en AI audit på 30 minutter.</p>
    <a class="btn btn-primary" href="${SITE}?wizard=1">Få en AI audit →</a>
  </div>
  ${related.length ? `<section class="related"><h4>Mere fra biblioteket</h4><div class="grid">${related.map(card).join('\n')}</div></section>` : ''}
  ${footerLinks}
</article>` + footer;
  fs.writeFileSync(path.join(DIR, p.slug + '.html'), page);
}

console.log('Built ' + posts.length + ' resource(s) + index.html → ' + DIR);
posts.forEach(p => console.log('  • ' + p.slug + '.html  [' + p.type + ']  ' + p.file));
