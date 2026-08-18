/** Client-side JS for the view SPA, served inline. No framework, no bundler. */
export const APP_SCRIPT = `
let allSpecs = [];
let selectedId = null;
let mcpConnected = false;
let tocScroll = null;
let listTab = 'done';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));

async function init() {
  initTheme();
  readUrl();
  await loadSpecs();
  restoreHash();
  setupSSE();
  setupInfoTip();
  loadStatus();
  $('status-pill').addEventListener('click', () => loadStatus());
  $('theme-toggle').addEventListener('click', toggleTheme);
}

function readUrl() {
  const q = new URLSearchParams(location.search);
  const tab = q.get('tab');
  if (tab === 'done' || tab === 'backlog') listTab = tab;
  selectedId = q.get('id');
}

/** Keeps the address bar in sync so refresh (and copied links) restore this view. */
function writeUrl(hash) {
  const q = new URLSearchParams();
  if (listTab !== 'done') q.set('tab', listTab);
  if (selectedId) q.set('id', selectedId);
  const search = q.toString();
  const h = hash === undefined ? location.hash : hash;
  const path = location.pathname
    + (search ? '?' + search : '')
    + (h && h !== '#' ? (h.charAt(0) === '#' ? h : '#' + h) : '');
  history.replaceState(null, '', path);
}

function restoreHash() {
  if (!location.hash) return;
  const t = $('detail').querySelector(location.hash);
  if (t) t.scrollIntoView({ block: 'start' });
}

const SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function initTheme() {
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('specdive-theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const t = document.documentElement.getAttribute('data-theme') || 'light';
  $('theme-toggle').innerHTML = t === 'light' ? MOON_SVG : SUN_SVG;
}

async function loadStatus() {
  const pill = $('status-pill');
  pill.className = 'status-pill';
  pill.querySelector('.status-label').textContent = 'checking…';
  try {
    const r = await fetch('/api/status');
    const st = await r.json();
    renderStatus(st.targets || []);
  } catch {
    pill.className = 'status-pill warn';
    pill.querySelector('.status-label').textContent = 'status unavailable';
  }
}

function targetOk(t) {
  return t.installed && t.commandResolves && t.reachable;
}

function targetMark(t) {
  if (targetOk(t)) return t.target + ' ✓';
  if (!t.commandResolves) return t.target + ' (cmd not found)';
  if (!t.reachable) return t.target + ' (assistant not found)';
  return t.target;
}

function targetHint(t) {
  const cmd = (t.command || []).join(' ');
  if (targetOk(t)) return cmd + ' | ' + t.target + ' reachable';
  if (!t.commandResolves) return t.target + ': launch command not resolvable: ' + cmd;
  if (!t.reachable) return t.target + ': CLI not reachable. Is it installed on your PATH?';
  return t.target;
}

function renderStatus(targets) {
  mcpConnected = targets.some(targetOk);
  renderList();
  const pill = $('status-pill');
  const label = pill.querySelector('.status-label');
  if (!targets.length) {
    pill.className = 'status-pill off';
    label.textContent = 'MCP not installed';
    pill.title = 'No specdive MCP config found. Run: specdive init';
    return;
  }
  const allOk = targets.every(targetOk);
  pill.className = allOk ? 'status-pill ok' : 'status-pill warn';
  label.textContent = 'MCP: ' + targets.map(targetMark).join(', ');
  pill.title = targets.map(targetHint).join('\\n');
}

async function loadSpecs() {
  const r = await fetch('/api/specs');
  allSpecs = (await r.json()).specs || [];
  renderList();
  if (selectedId) await renderDetail(selectedId);
}

function setupSSE() {
  const es = new EventSource('/api/events');
  es.addEventListener('change', () => loadSpecs());
  es.onerror = () => { es.close(); setTimeout(setupSSE, 3000); };
}

function renderList() {
  if (allSpecs.length === 0) { renderEmpty(); $('count').textContent = '0 specs'; return; }
  const done = allSpecs.filter(s => s.status === 'done').sort(byLatest);
  const backlog = allSpecs.filter(s => s.status !== 'done').sort(byLatest);
  const specs = listTab === 'done' ? done : backlog;
  $('list').innerHTML = tabBar(done.length, backlog.length)
    + '<div class="list-body">' + listItems(specs) + '</div>';
  $('count').textContent = allSpecs.length + (allSpecs.length === 1 ? ' spec' : ' specs');
  bindList();
}

function tabBar(doneN, backlogN) {
  return '<div class="list-tabs" role="tablist">'
    + tabBtn('done', 'Done', doneN)
    + tabBtn('backlog', 'Backlog', backlogN)
    + '</div>';
}

function tabBtn(id, label, n) {
  const on = listTab === id;
  return '<button type="button" class="list-tab' + (on ? ' active' : '') + '" role="tab" aria-selected="' + on + '" data-tab="' + id + '">'
    + label + ' <span class="n">' + n + '</span></button>';
}

function listItems(specs) {
  if (!specs.length) return '<div class="empty">—</div>';
  return specs.map(s => {
    return '<div class="item' + (s.id === selectedId ? ' active' : '') + '" role="button" tabindex="0" data-id="' + s.id + '">'
      + '<span class="dot ' + s.status + '"></span><span class="title" title="' + esc(s.title) + '">' + esc(s.title) + '</span>'
      + '</div>';
  }).join('');
}

function bindList() {
  $('list').querySelectorAll('.list-tab').forEach(el => {
    el.onclick = () => { listTab = el.dataset.tab; renderList(); writeUrl(); };
  });
  $('list').querySelectorAll('.item').forEach(el => {
    el.onclick = () => select(el.dataset.id);
  });
}

/** Empty-state checklist — each step shows ✓ when done. */
function renderEmpty() {
  const step1 = mcpConnected
    ? '<li class="done">✓ MCP connected</li>'
    : '<li>☐ Run <code>specdive init</code> to connect MCP</li>';
  $('list').innerHTML =
    '<div class="empty-state">'
    + '<h2>No specs yet</h2>'
    + '<ul class="checklist">'
    + step1
    + '<li>☐ Ask your AI assistant: "Initialize specdive for this codebase"</li>'
    + '</ul>'
    + '</div>';
  showPlaceholder();
}

async function select(id) {
  selectedId = id;
  const spec = allSpecs.find(s => s.id === id);
  const tab = spec && spec.status === 'done' ? 'done' : 'backlog';
  if (tab !== listTab) {
    listTab = tab;
    renderList();
  } else {
    document.querySelectorAll('.item').forEach(el => el.classList.toggle('active', el.dataset.id === id));
  }
  await renderDetail(id);
  window.scrollTo(0, 0);
  writeUrl('');
}

function showPlaceholder() {
  $('detail').innerHTML = '<div class="detail-placeholder"><p>Select a feature to see its spec.</p></div>';
  $('toc').innerHTML = '';
  $('toc').hidden = true;
  $('layout').classList.remove('has-toc');
}

async function renderDetail(id) {
  const r = await fetch('/api/specs/' + encodeURIComponent(id));
  if (!r.ok) { $('detail').innerHTML = '<p class="empty">Unable to load spec ' + esc(id) + '</p>'; return; }
  const spec = await r.json();
  const page = buildPage(spec);
  $('detail').innerHTML = page.article;
  $('toc').innerHTML = page.toc;
  $('toc').hidden = !page.toc;
  $('layout').classList.toggle('has-toc', !!page.toc);
  bindDocNav();
}

function buildPage(spec) {
  const fm = spec.frontmatter;
  const secs = parseSections(spec.body);
  const order = ['Summary','Capabilities','Known Issues','Security Notes','Open Questions'];
  const group = fm.status === 'done' ? 'Done' : 'Backlog';
  const tocNames = [];
  let article = '<div class="detail-inner">';
  article += '<nav class="crumbs"><span>' + group + '</span><span class="sep">›</span><span>' + esc(fm.title) + '</span></nav>';
  article += '<h1 class="doc-title">' + esc(fm.title) + '</h1>';
  article += '<div class="detail-meta"><span class="ver">' + esc(fm.id) + '</span>';
  article += '<span class="meta-item">' + fmtDate(fm.updated_at) + '</span>';
  article += '<span class="meta-item">by ' + esc(fm.updated_by) + '</span></div>';
  order.forEach(name => {
    if (!secs[name]) return;
    if (name !== 'Summary') tocNames.push(name);
    article += detailSection(name, secs[name]);
  });
  if (fm.source_files && fm.source_files.length) {
    tocNames.push('Files');
    article += metaSection('Files', fm.source_files, false);
  }
  if (fm.depends_on && fm.depends_on.length) {
    tocNames.push('Depends on');
    article += metaSection('Depends on', fm.depends_on, true);
  }
  if (fm.commits && fm.commits.length) {
    tocNames.push('Commits');
    article += commitSection(fm.commits);
  }
  if (secs['Progress Log']) {
    tocNames.push('Progress Log');
    article += detailSection('Progress Log', secs['Progress Log']);
  }
  return { article: article + '</div>', toc: tocHtml(tocNames) };
}

function detailSection(name, src) {
  const body = name === 'Progress Log' ? renderProgress(src) : renderMarkdown(src);
  const title = name === 'Summary' ? '' : '<h2>' + name + '</h2>';
  return '<section id="' + slug(name) + '" class="section ' + sectionClass(name) + '">' + title + '<div class="body">' + body + '</div></section>';
}

function sectionClass(name) {
  if (name === 'Summary') return 'lead';
  if (name === 'Known Issues') return 'flag flag-issues';
  if (name === 'Security Notes') return 'flag flag-security';
  if (name === 'Progress Log') return 'log';
  return '';
}

function metaSection(label, items, deps) {
  const cls = deps ? 'dep-list' : 'file-list';
  const rows = items.map(v => {
    if (!deps) return '<li>' + esc(v) + '</li>';
    const spec = allSpecs.find(s => s.id === v);
    const title = spec ? esc(spec.title) : '';
    return '<li><button type="button" class="dep-link" data-id="' + esc(v) + '">' + esc(v) + (title ? ' — ' + title : '') + '</button></li>';
  }).join('');
  return '<section id="' + slug(label) + '" class="section"><h2>' + label + '</h2><ul class="' + cls + '">' + rows + '</ul></section>';
}

function commitSection(commits) {
  const rows = commits.slice().reverse().map(c => {
    const sha = String(c.sha || '');
    const short = sha.slice(0, 7);
    return '<li><code class="sha" title="' + esc(sha) + '">' + esc(short) + '</code> ' + esc(c.message || '') + '</li>';
  }).join('');
  return '<section id="commits" class="section"><h2>Commits</h2><ul class="commit-list">' + rows + '</ul></section>';
}

function tocHtml(names) {
  if (!names.length) return '';
  return '<p class="toc-title">On this page</p>'
    + names.map(n => '<a class="toc-link" href="#' + slug(n) + '">' + esc(n) + '</a>').join('');
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function bindDocNav() {
  $('detail').querySelectorAll('.dep-link').forEach(el => {
    el.addEventListener('click', () => select(el.dataset.id));
  });
  const root = $('detail');
  const links = [...$('toc').querySelectorAll('.toc-link')];
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      const t = root.querySelector(href);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      writeUrl(href);
    });
  });
  const secs = links.map(a => root.querySelector(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    let current = secs[0];
    for (const s of secs) { if (s.getBoundingClientRect().top < 140) current = s; }
    if (!current) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  };
  if (tocScroll) window.removeEventListener('scroll', tocScroll);
  tocScroll = onScroll;
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return esc(String(iso || ''));
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function renderProgress(src) {
  const items = [];
  src.split('\\n').forEach(line => {
    const m = line.match(/^[-*]\\s+(.*)$/);
    if (m) items.push(m[1]);
    else if (items.length && line.trim()) items[items.length - 1] += ' ' + line.trim();
  });
  if (!items.length) return renderMarkdown(src);
  return '<ol class="timeline">' + items.map(progressItem).join('') + '</ol>';
}

function progressItem(item) {
  const dm = item.match(/^(\\d{4}-\\d{2}-\\d{2})(?:T[\\d:.Z]+)?\\s*(?:\\(([^)]+)\\))?\\s*:?\\s*(.*)$/);
  if (!dm) return '<li><div class="when"></div><p>' + inline(item) + '</p></li>';
  const tag = dm[2] ? '<span class="log-tag">' + esc(dm[2]) + '</span>' : '';
  return '<li><div class="when">' + esc(dm[1]) + tag + '</div><p>' + inline(dm[3]) + '</p></li>';
}

function parseSections(body) {
  const out = {};
  let name = null, lines = [];
  body.split('\\n').forEach(line => {
    const m = line.match(/^##\\s+(.+)$/);
    if (m) { if (name) out[name] = lines.join('\\n').trim(); name = m[1].trim(); lines = []; }
    else if (name) lines.push(line);
  });
  if (name) out[name] = lines.join('\\n').trim();
  return out;
}

/* ---- minimal markdown renderer (no deps; HTML-escapes all text) ---- */

function inline(s) {
  const codes = [];
  s = s.replace(/\`([^\`]+)\`/g, (m, c) => { codes.push(esc(c)); return '\\u0000' + (codes.length - 1) + '\\u0000'; });
  s = esc(s);
  s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  s = s.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
  s = s.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g, (m, t, u) => '<a href="' + u.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">' + t + '</a>');
  s = s.replace(/\\u0000(\\d+)\\u0000/g, (m, i) => '<code>' + codes[+i] + '</code>');
  return s;
}

function renderMarkdown(src) {
  const lines = src.split('\\n');
  let out = '';
  let para = [], quote = [], code = null;
  const lists = [];

  const flushPara = () => { if (para.length) { out += '<p>' + inline(para.join(' ')) + '</p>'; para = []; } };
  const flushQuote = () => { if (quote.length) { out += '<blockquote>' + inline(quote.join(' ')) + '</blockquote>'; quote = []; } };
  const flushLists = () => { while (lists.length) { const l = lists.pop(); out += '</li></' + l.type + '>'; } };
  const flushAll = () => { flushPara(); flushQuote(); flushLists(); };

  for (const raw of lines) {
    const t = raw.trim();
    if (code !== null) {
      if (/^\`\`\`/.test(t)) { out += '<pre><code>' + esc(code.join('\\n')) + '</code></pre>'; code = null; }
      else code.push(raw);
      continue;
    }
    if (/^\`\`\`/.test(t)) { flushAll(); code = []; continue; }
    if (t === '') { flushAll(); continue; }

    const h = t.match(/^(#{1,6})\\s+(.*)$/);
    if (h) { flushAll(); const lvl = Math.min(h[1].length + 3, 6); out += '<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>'; continue; }

    if (/^(-{3,}|\\*{3,}|_{3,})$/.test(t)) { flushAll(); out += '<hr>'; continue; }

    if (t.startsWith('>')) { flushPara(); flushLists(); quote.push(t.replace(/^>\\s?/, '')); continue; }

    const li = t.match(/^([-*]|\\d+\\.)\\s+(.*)$/);
    if (li) {
      flushPara(); flushQuote();
      const type = /\\d/.test(li[1]) ? 'ol' : 'ul';
      const indent = raw.match(/^\\s*/)[0].length;
      if (!lists.length || indent > lists[lists.length - 1].indent) {
        out += '<' + type + '>'; lists.push({ type, indent }); out += '<li>' + inline(li[2]);
      } else {
        while (lists.length > 1 && lists[lists.length - 1].indent > indent) { const l = lists.pop(); out += '</li></' + l.type + '>'; }
        const top = lists[lists.length - 1];
        if (top.type !== type) {
          out += '</li></' + top.type + '>'; lists.pop();
          out += '<' + type + '>'; lists.push({ type, indent }); out += '<li>' + inline(li[2]);
        } else {
          out += '</li><li>' + inline(li[2]);
        }
      }
      continue;
    }

    // Lazy continuation: wrap lines of a list item (typical in spec markdown).
    if (lists.length) { out += ' ' + inline(t); continue; }
    flushQuote(); flushLists();
    para.push(t);
  }
  if (code !== null) out += '<pre><code>' + esc(code.join('\\n')) + '</code></pre>';
  flushAll();
  return out;
}

function byLatest(a,b){ return b.id.localeCompare(a.id, undefined, { numeric: true }); }

function setupInfoTip() {
  document.querySelectorAll('.info-tip').forEach(t => {
    t.addEventListener('click', (e) => { e.stopPropagation(); t.classList.toggle('open'); });
  });
  document.addEventListener('click', () => document.querySelectorAll('.info-tip').forEach(t => t.classList.remove('open')));
}

init();
`;
