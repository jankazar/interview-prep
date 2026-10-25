#!/usr/bin/env node
// Converts an interview-questions web page (e.g. GeeksforGeeks) into Q&A markdown
// that mirrors the source structure. No dependencies - requires Node 16+.
//
// Usage: node html2qa.js <page.html | url> [-o out.md]
//
// Mapping:
//   <h1>/<h2>          -> "## " section heading
//   <h3>               -> "### " question heading
//   <h4>..<h6>         -> **bold sub-header** on its own line (no bullet)
//   <p>                -> plain paragraph; a bold-only <p> becomes a sub-header
//   <li>               -> "* " bullet (<ol> items -> "1. "), nested lists indented
//   <blockquote>       -> fenced code block, one line per <p>/<br>
//   <pre>, <gfg-panel> -> fenced code block (language from data-code-lang)
//   <table>            -> markdown table
//   <img>, carousel    -> ![alt](src)
//   <b>/<strong>, <i>/<em>, <code> -> **x**, *x*, `x`; links keep their text only

const fs = require('fs');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'iframe', 'button', 'form', 'gfg-tab']);
const IMG = new Set(['img', 'gfg-carousel-content']);
const BLOCK = new Set(['gfg-carousel-content', 'p', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre',
  'table', 'img', 'gfg-tabs', 'gfg-panel', 'figure', 'section', 'hr']);

function decode(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', rarr: '→', larr: '←', times: '×', copy: '©' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return named[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(s) {
  const attrs = {};
  const re = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(s))) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

// Builds a lightweight DOM tree; tolerant of unclosed tags.
function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype[^>]*>|<\/([\w-]+)\s*>|<([\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+|<)/gi;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[4] !== undefined) {
      top.children.push({ tag: '#text', text: decode(m[4]) });
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const node = { tag, attrs: parseAttrs(m[3]), children: [] };
      top.children.push(node);
      if (VOID.has(tag) || m[3].trim().endsWith('/')) continue;
      if (tag === 'script' || tag === 'style') {
        const end = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        re.lastIndex = end < 0 ? html.length : end;
      }
      stack.push(node);
    } else if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
    }
  }
  return root;
}

// Returns the article body: GfG's <div class="text">, else <article>, <main>, <body>.
function findContent(root) {
  const byClass = (n) => n.tag === 'div' && (n.attrs.class || '').split(/\s+/).includes('text');
  for (const pred of [byClass, (n) => n.tag === 'article', (n) => n.tag === 'main', (n) => n.tag === 'body']) {
    const found = find(root, pred);
    if (found) return found;
  }
  return root;
}

function find(node, pred) {
  if (pred(node)) return node;
  for (const c of node.children || []) {
    const f = find(c, pred);
    if (f) return f;
  }
  return null;
}

function textOf(node) {
  if (node.tag === '#text') return node.text;
  if (node.tag === 'br') return '\n';
  if (SKIP.has(node.tag) && node.tag !== 'gfg-tab') return '';
  return node.children.map(textOf).join('');
}

function inline(node) {
  if (node.tag === '#text') return node.text.replace(/\s+/g, ' ');
  if (SKIP.has(node.tag)) return '';
  if (node.tag === 'br') return '\n';
  if (IMG.has(node.tag)) return image(node);
  if (node.tag === 'code' || isCodeSpan(node)) {
    // Formatting inside code spans is dropped; markdown can't nest it.
    const code = textOf(node).replace(/\s+/g, ' ');
    return code.trim() ? '`' + code + '`' : code;
  }
  const inner = node.children.map(inline).join('');
  switch (node.tag) {
    case 'b': case 'strong': return wrap(inner, '**');
    case 'i': case 'em': return wrap(inner, '*');
    default: return inner;
  }
}

// Some sites (e.g. zerotomastery.io) mark inline code as a <span> with a background color.
function isCodeSpan(node) {
  return node.tag === 'span' && /background(-color)?\s*:\s*#/i.test(node.attrs.style || '');
}

// Keeps surrounding whitespace outside the markers ("**a: **" -> "**a:** ").
function wrap(s, mark) {
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m[2]) return s;
  if (m[2].startsWith(mark) && m[2].endsWith(mark)) return s; // nested <b><strong>
  return m[1] + mark + m[2] + mark + m[3];
}

// Collapses whitespace and merges adjacent bold runs ("**a****:**" -> "**a:**",
// "**a** **b**" -> "**a b**") and adjacent code spans ("`a`` b`" -> "`a b`").
function clean(s) {
  return s.replace(/\*\*\*\*/g, '').replace(/\*\* \*\*/g, ' ').replace(/``/g, '')
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

function image(node) {
  const src = node.attrs.src || node.attrs['data-src'] || '';
  if (!src || src.startsWith('data:')) return '';
  const alt = (node.attrs.alt || '').trim() || src.split('/').pop();
  return `![${alt}](${src})`;
}

function isBoldOnly(node) {
  let bold = false;
  const walk = (n, inBold) => {
    if (n.tag === '#text') {
      if (!n.text.trim()) return true;
      if (inBold) { bold = true; return true; }
      return false;
    }
    if (IMG.has(n.tag) || n.tag === 'code') return false;
    const b = inBold || n.tag === 'b' || n.tag === 'strong';
    return n.children.every((c) => walk(c, b));
  };
  return walk(node, false) && bold;
}

function fence(code, lang = '') {
  code = code.replace(/\r/g, '').replace(/^\n+|\s+$/g, '');
  const ticks = code.includes('```') ? '````' : '```';
  return `${ticks}${lang}\n${code}\n${ticks}`;
}

function table(node) {
  const rows = [];
  const walk = (n) => {
    if (n.tag === 'tr') rows.push(n.children.filter((c) => c.tag === 'td' || c.tag === 'th')
      .map((c) => clean(c.children.map(inline).join('')).replace(/\n/g, '<br>').replace(/\|/g, '\\|')));
    else (n.children || []).forEach(walk);
  };
  walk(node);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r) => '| ' + Array.from({ length: width }, (_, i) => r[i] ?? '').join(' | ') + ' |';
  return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n');
}

// Renders a list; nested lists are indented under their parent item.
function list(node, depth) {
  const ordered = node.tag === 'ol';
  const pad = '  '.repeat(depth);
  const out = [];
  let n = parseInt(node.attrs.start || '1', 10);
  for (const li of node.children.filter((c) => c.tag === 'li')) {
    const textParts = [];
    const nested = [];
    for (const c of li.children) {
      if (c.tag === 'ul' || c.tag === 'ol') nested.push(list(c, depth + 1));
      else if (c.tag === 'pre' || c.tag === 'blockquote' || c.tag === 'gfg-tabs' || c.tag === 'table') nested.push(indent(blocks(c).join('\n\n'), pad + '  '));
      else if (IMG.has(c.tag)) nested.push(pad + '  ' + image(c));
      else textParts.push(inline(c));
    }
    const marker = ordered ? `${n++}.` : '*';
    const text = clean(textParts.join('')).replace(/\n/g, ' ');
    out.push(`${pad}${marker} ${text}`);
    out.push(...nested.filter(Boolean));
  }
  return out.join('\n');
}

function indent(s, pad) {
  return s.split('\n').map((l) => (l ? pad + l : l)).join('\n');
}

function blockquote(node) {
  const lines = [];
  const walk = (n) => {
    if (n.tag === 'p' || n.tag === 'div' || n.tag === 'li') {
      lines.push(...textOf(n).replace(/ /g, ' ').split('\n'));
    } else (n.children || []).forEach(walk);
  };
  walk(node);
  if (!lines.length) lines.push(...textOf(node).split('\n'));
  return fence(lines.map((l) => l.replace(/\s+$/, '')).join('\n'));
}

function codeTabs(node) {
  const panels = [];
  const walk = (n) => {
    if (n.tag === 'gfg-panel') panels.push(n);
    else (n.children || []).forEach(walk);
  };
  walk(node);
  return panels.map((p) => {
    const pre = find(p, (x) => x.tag === 'pre') || p;
    return fence(textOf(pre), p.attrs['data-code-lang'] || '');
  });
}

// Converts a block-level node into a list of markdown blocks.
function blocks(node) {
  if (node.tag === '#text') {
    const t = clean(node.text);
    return t ? [t] : [];
  }
  if (SKIP.has(node.tag)) return [];
  switch (node.tag) {
    case 'h1': case 'h2': return [`## ${clean(textOf(node))}`];
    case 'h3': return [`### ${clean(textOf(node))}`];
    case 'h4': case 'h5': case 'h6': return [`**${clean(textOf(node))}**`];
    case 'p': {
      if (isBoldOnly(node)) return [`**${clean(textOf(node))}**`];
      // Images and block elements (e.g. a <pre> nested in a <p>) inside a paragraph become their own blocks.
      const out = [];
      let buf = [];
      const flush = () => { const t = clean(buf.join('')); if (t) out.push(t); buf = []; };
      for (const c of node.children) {
        if (IMG.has(c.tag)) { flush(); const i = image(c); if (i) out.push(i); }
        else if (BLOCK.has(c.tag) || hasBlockChild(c)) { flush(); out.push(...blocks(c)); }
        else buf.push(inline(c));
      }
      flush();
      return out;
    }
    case 'ul': case 'ol': return [list(node, 0)];
    case 'blockquote': return [blockquote(node)];
    case 'pre': return [fence(textOf(node), langOf(node))];
    case 'gfg-tabs': return codeTabs(node);
    case 'table': return [table(node)];
    case 'img': case 'gfg-carousel-content': { const i = image(node); return i ? [i] : []; }
    case 'hr': return [];
  }
  // Container (div, section, figure, span with block children, ...).
  const out = [];
  let buf = [];
  const flush = () => { const t = clean(buf.join('')); if (t) out.push(t); buf = []; };
  for (const c of node.children) {
    if (BLOCK.has(c.tag) || hasBlockChild(c)) { flush(); out.push(...blocks(c)); }
    else buf.push(inline(c));
  }
  flush();
  return out;
}

function hasBlockChild(n) {
  return (n.children || []).some((c) => BLOCK.has(c.tag) || hasBlockChild(c));
}

function langOf(node) {
  const code = find(node, (n) => n.tag === 'code' && /language-/.test(n.attrs.class || ''));
  const m = code && code.attrs.class.match(/language-([\w+#-]+)/);
  return m ? m[1] : '';
}

async function load(src) {
  if (!/^https?:\/\//i.test(src)) return fs.readFileSync(src, 'utf8');
  const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${src}`);
  return res.text();
}

async function main() {
  const args = process.argv.slice(2);
  const oi = args.indexOf('-o');
  const out = oi >= 0 ? args.splice(oi, 2)[1] : null;
  if (!args[0]) {
    console.error('Usage: node html2qa.js <page.html | url> [-o out.md]');
    process.exit(1);
  }
  const content = findContent(parse(await load(args[0])));
  const md = blocks(content).join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
  if (out) fs.writeFileSync(out, md, 'utf8');
  else process.stdout.write(md);
  const questions = (md.match(/^### /gm) || []).length;
  console.error(`Converted: ${questions} questions, ${md.length} chars${out ? ` -> ${out}` : ''}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
