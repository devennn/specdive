/**
 * Inline CSS for the view SPA. Two themes from the "Synthetic Intelligence"
 * design system — light (default) and dark — applied via [data-theme].
 * Typography: Inter (sans) + JetBrains Mono (technical metadata).
 * Depth via tonal layering + glassmorphism, not heavy shadows.
 */
export const STYLES = `
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --r-sm: 6px;
  --r-lg: 12px;
  --r-full: 9999px;
  --header-h: 48px;
  --measure: 42rem;

  --bg: #ffffff;
  --panel: #f7f8fa;
  --panel-hover: #eef0f3;
  --header: #ffffff;
  --border: #eceef2;
  --text: #111318;
  --text-muted: #5c6470;
  --primary: #0052ff;
  --on-primary: #ffffff;
  --primary-tint: rgba(0, 82, 255, 0.10);
  --success: #0d9488;
  --warning: #b45309;
  --error: #ba1a1a;
  --info: #0052ff;
  --flag-bg: rgba(186, 26, 26, 0.06);
  --flag-security-bg: rgba(180, 83, 9, 0.08);
  --glass: rgba(255, 255, 255, 0.78);
  --glass-border: rgba(255, 255, 255, 0.6);
  --status-done: #0d9488;
  --status-backlog: #6b7280;
  --pre-bg: #0f172a;
  --pre-text: #e2e8f0;
  --shadow: 0 8px 24px rgba(17, 19, 24, 0.08);
  --thumb: rgba(17, 19, 24, 0.28);
}

[data-theme="dark"] {
  --bg: #0b1326;
  --panel: #131b2e;
  --panel-hover: #1c2540;
  --header: #10182c;
  --border: #2a3448;
  --text: #dae2fd;
  --text-muted: #9aa6b8;
  --primary: #8ed5ff;
  --on-primary: #00354a;
  --primary-tint: rgba(56, 189, 248, 0.14);
  --success: #2dd4bf;
  --warning: #fbbf24;
  --error: #fb7185;
  --info: #38bdf8;
  --flag-bg: rgba(225, 29, 72, 0.12);
  --flag-security-bg: rgba(251, 191, 36, 0.10);
  --glass: rgba(19, 27, 46, 0.78);
  --glass-border: rgba(142, 213, 255, 0.15);
  --status-done: #2dd4bf;
  --status-backlog: #87929a;
  --pre-bg: #060e20;
  --pre-text: #dae2fd;
  --shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  --thumb: rgba(218, 226, 253, 0.32);
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
html {
  scrollbar-width: thin;
  scrollbar-color: var(--thumb) transparent;
}
html::-webkit-scrollbar { width: 8px; }
html::-webkit-scrollbar-track { background: transparent; }
html::-webkit-scrollbar-thumb { background: var(--thumb); border-radius: 999px; }
html::-webkit-scrollbar-button { display: none; }
body { margin: 0; min-height: 100%; font: 16px/1.7 var(--font-sans); color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; letter-spacing: -0.011em; }

header { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 12px; height: var(--header-h); padding: 0 18px; border-bottom: 1px solid var(--border); background: var(--header); }
header .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
header .brand-lockup { display: flex; align-items: center; gap: 8px; min-width: 0; }
header .brand-icon { width: 22px; height: 22px; flex: none; display: block; }
header h1 { font-size: 15px; font-weight: 650; margin: 0; letter-spacing: -0.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
header .divider { width: 1px; height: 18px; background: var(--border); flex: none; }

.view-switch { display: inline-flex; align-items: center; gap: 2px; height: 28px; padding: 2px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel); flex: none; }
.view-switch-btn { height: 22px; padding: 0 10px; border: 0; border-radius: 4px; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 650; font-family: var(--font-sans); letter-spacing: 0.01em; cursor: pointer; }
.view-switch-btn:hover { color: var(--text); }
.view-switch-btn.active { background: var(--bg); color: var(--text); box-shadow: 0 1px 2px rgba(17, 19, 24, 0.08); }
[data-theme="dark"] .view-switch-btn.active { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28); }

.status-pill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: var(--r-full); font-size: 11px; font-family: var(--font-mono); cursor: pointer; background: var(--bg); border: 1px solid var(--border); color: var(--text-muted); user-select: none; white-space: nowrap; transition: border-color .15s; }
.status-pill:hover { border-color: var(--primary); }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--text-muted); }
.status-pill.ok .status-dot { background: var(--success); box-shadow: 0 0 6px var(--success); }
.status-pill.ok { color: var(--success); }
.status-pill.warn .status-dot { background: var(--warning); }
.status-pill.warn { color: var(--warning); }
.status-pill.off .status-dot { background: var(--error); }
.status-pill.off { color: var(--error); }

header .count { font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); white-space: nowrap; }

header .toolbar { margin-left: auto; display: flex; gap: 6px; align-items: center; }

.theme-toggle { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--r-sm); border: 1px solid var(--border); background: var(--bg); color: var(--text-muted); cursor: pointer; line-height: 1; transition: border-color .15s, color .15s; }
.theme-toggle:hover { border-color: var(--primary); color: var(--primary); }

.info-tip { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--border); color: var(--text-muted); cursor: help; font-size: 11px; font-style: italic; flex: none; }
.info-tip:hover { border-color: var(--primary); color: var(--primary); }
.info-tip-pop { display: none; position: absolute; top: 24px; right: 0; width: 280px; padding: 12px 14px; background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: var(--r-lg); z-index: 50; color: var(--text-muted); font-size: 12px; line-height: 1.5; box-shadow: var(--shadow); }
.info-tip.open .info-tip-pop { display: block; }

.layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); align-items: start; min-height: calc(100vh - var(--header-h)); }
.layout.has-toc { grid-template-columns: 340px minmax(0, 1fr) 220px; }
.list { position: sticky; top: var(--header-h); height: calc(100vh - var(--header-h)); display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); background: var(--panel); }
.list-tabs { display: flex; flex: none; border-bottom: 1px solid var(--border); }
.list-tab { flex: 1; height: 42px; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: none; color: var(--text-muted); font-size: 12px; font-weight: 650; font-family: var(--font-sans); letter-spacing: 0.02em; cursor: pointer; }
.list-tab:hover { color: var(--text); }
.list-tab.active { color: var(--text); border-bottom-color: var(--primary); }
.list-tab .n { font-family: var(--font-mono); font-size: 11px; font-weight: 500; color: var(--text-muted); margin-left: 4px; }
.list-body { flex: 1; overflow-y: auto; padding: 10px 12px 28px; scrollbar-width: thin; scrollbar-color: var(--thumb) transparent; }
.list-body::-webkit-scrollbar { width: 6px; }
.list-body::-webkit-scrollbar-track { background: transparent; }
.list-body::-webkit-scrollbar-thumb { background: var(--thumb); border-radius: 999px; }
.item { position: relative; display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 6px; cursor: pointer; transition: background .12s; }
.item:hover { background: var(--panel-hover); }
.item:focus { outline: none; }
.item:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.item.active { background: var(--primary-tint); }
.item.active::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: var(--r-full); background: var(--primary); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--text-muted); }
.dot.done { background: var(--status-done); }
.dot.backlog { background: var(--status-backlog); }
.item .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }

.empty { color: var(--text-muted); padding: 20px 4px; }
.empty-state { padding: 24px 8px; color: var(--text); }
.empty-state h2 { font-size: 18px; font-weight: 600; margin: 0 0 12px; letter-spacing: -0.02em; }
.empty-state .checklist { list-style: none; margin: 12px 0; padding: 0; }
.empty-state .checklist li { margin: 12px 0; line-height: 1.6; color: var(--text-muted); }
.empty-state .checklist li.done { color: var(--success); }
.empty-state code { font-family: var(--font-mono); font-size: 12px; background: var(--panel-hover); padding: 2px 6px; border-radius: var(--r-sm); }
.empty-state .checklist li.done code { background: transparent; }

.detail { overflow: visible; min-width: 0; padding: 20px 48px 96px; }
.detail-inner { max-width: 46rem; }
.detail-placeholder { min-height: calc(100vh - var(--header-h) - 40px); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 15px; }

.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin: 0 0 10px; }
.crumbs .sep { opacity: 0.45; }
.ver { display: inline-block; font-size: 12px; font-weight: 500; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; }
.doc-title { font-size: 2.4rem; font-weight: 700; margin: 0 0 1.15rem; letter-spacing: -0.04em; line-height: 1.15; }
.detail-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; color: var(--text-muted); font-size: 13px; margin: -0.5rem 0 1.5rem; }
.detail-meta .meta-item { font-variant-numeric: tabular-nums; }

.section { margin: 0; padding: 0; scroll-margin-top: calc(var(--header-h) + 16px); }
.section h2 { font-size: 1.5rem; font-family: var(--font-sans); font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin: 2.4rem 0 0.85rem; }
.section .body { line-height: 1.75; color: var(--text); }
.section .body p { margin: 0 0 0.9em; }
.section .body p:last-child { margin-bottom: 0; }
.section .body ul, .section .body ol { margin: 0.2em 0 0.9em; padding-left: 1.4em; }
.section .body ul { list-style: disc; }
.section .body ol { list-style: decimal; }
.section .body li { margin: 0.4em 0; }
.section .body li::marker { color: var(--text-muted); }
.section .body li > p { margin: 0; }
.section .body h4, .section .body h5, .section .body h6 { margin: 1.2em 0 0.4em; font-weight: 600; color: var(--text); }
.section .body h4 { font-size: 1.05rem; }
.section .body h5 { font-size: 1rem; }
.section .body h6 { font-size: 0.9rem; color: var(--text-muted); }
.section .body code { font-family: var(--font-mono); font-size: 0.86em; background: var(--panel); padding: 0.12em 0.4em; border-radius: 4px; }
.section .body pre { background: var(--pre-bg); color: var(--pre-text); border-radius: var(--r-sm); padding: 14px 16px; overflow-x: auto; margin: 0 0 1em; }
.section .body pre code { background: transparent; padding: 0; font-size: 0.86em; line-height: 1.65; color: inherit; }
.section .body blockquote { border-left: 2px solid var(--border); margin: 0 0 1em; padding: 0 0 0 1em; color: var(--text-muted); }
.section .body hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.section .body a { color: var(--primary); text-decoration: none; }
.section .body a:hover { text-decoration: underline; }
.section .body strong { font-weight: 600; }
.section .body em { font-style: italic; }

.section.lead { margin: 0 0 0.5rem; }
.section.lead .body { font-size: 1.05rem; line-height: 1.75; }

.section.flag { margin: 2rem 0 0; padding: 1rem 1.15rem; border: 1px solid rgba(186, 26, 26, 0.18); border-left: 5px solid var(--error); border-radius: 0 6px 6px 0; background: var(--flag-bg); }
.section.flag h2 { color: var(--error); margin: 0 0 0.45rem; font-size: 1rem; }
.section.flag-security { border-color: rgba(180, 83, 9, 0.22); border-left-color: var(--warning); background: var(--flag-security-bg); }
.section.flag-security h2 { color: var(--warning); }

.file-list, .dep-list, .commit-list { list-style: none; margin: 0; padding: 0; }
.file-list li { font-family: var(--font-mono); font-size: 13.5px; color: var(--text-muted); line-height: 1.85; }
.commit-list li { font-size: 14.5px; line-height: 1.85; color: var(--text); }
.commit-list .sha { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); margin-right: 8px; }
button.dep-link { appearance: none; background: none; border: none; padding: 0; font: inherit; color: var(--primary); cursor: pointer; text-align: left; }
button.dep-link:hover { text-decoration: underline; }

.timeline { list-style: none; margin: 0; padding: 0; }
.timeline li { padding: 0 0 1.15em; }
.timeline li:last-child { padding-bottom: 0; }
.timeline .when { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; margin-bottom: 2px; }
.timeline .log-tag { font-style: italic; font-size: 13px; color: var(--text-muted); margin-left: 6px; }
.timeline p { margin: 0; }

.toc { position: sticky; top: var(--header-h); height: calc(100vh - var(--header-h)); overflow-y: auto; padding: 28px 14px 48px 4px; border-left: 1px solid var(--border); scrollbar-width: thin; scrollbar-color: var(--thumb) transparent; }
.toc::-webkit-scrollbar { width: 6px; }
.toc::-webkit-scrollbar-track { background: transparent; }
.toc::-webkit-scrollbar-thumb { background: var(--thumb); border-radius: 999px; }
.toc-title { font-size: 13px; font-weight: 600; color: var(--text); margin: 0 0 10px 12px; }
.toc-link { display: block; font-size: 13px; color: var(--text-muted); text-decoration: none; padding: 5px 8px 5px 12px; border-left: 2px solid transparent; line-height: 1.35; }
.toc-link:hover { color: var(--text); }
.toc-link.active { color: var(--primary); border-left-color: var(--primary); font-weight: 500; }

.history { min-height: calc(100vh - var(--header-h)); padding: 32px 24px 96px; }
.history-inner { max-width: 36rem; margin: 0 auto; }
.history-head { margin: 0 0 1.75rem; }
.history-head h1 { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.04em; margin: 0 0 0.35rem; line-height: 1.15; }
.history-head .sub { font-size: 15px; color: var(--text-muted); }
.history-empty { color: var(--text-muted); font-size: 15px; margin: 0; }

.history-day { margin: 0; }
.history-day-label { position: sticky; top: var(--header-h); z-index: 4; margin: 1.75rem 0 0; padding: 10px 0 6px; background: var(--bg); font-size: 12px; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); }
.history-day:first-child .history-day-label { margin-top: 0; }

.history-group { position: relative; }
.history-item { display: grid; grid-template-columns: 18px max-content minmax(0, 1fr); gap: 0 10px; position: relative; padding: 6px 0; }
.history-item::before { content: ''; position: absolute; left: 4px; top: 17px; bottom: -17px; width: 2px; background: var(--border); }
.history-item:last-child::before { display: none; }
.history-rail { position: relative; z-index: 1; }
.history-dot { display: block; width: 10px; height: 10px; margin-top: 6px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 0 3px var(--bg); }
.history-time { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); padding-top: 5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.history-msg { font-size: 1.05rem; font-weight: 600; letter-spacing: -0.025em; line-height: 1.35; color: var(--text); margin: 0; }
.history-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 4px; font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); }
.history-meta .sha { color: var(--primary); }
.history-specs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.history-spec { appearance: none; background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 1px 8px; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); cursor: pointer; line-height: 1.7; }
.history-spec:hover { border-color: var(--primary); color: var(--primary); }

.history-pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 2rem; }
.history-page-btn { appearance: none; background: none; border: 0; padding: 0; font-size: 13px; font-weight: 650; font-family: var(--font-sans); color: var(--primary); cursor: pointer; }
.history-page-btn:hover { text-decoration: underline; }
.history-page-btn:disabled { color: var(--text-muted); cursor: default; text-decoration: none; }
.history-page-n { font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); }

@media (max-width: 1100px) {
  .layout.has-toc { grid-template-columns: 340px minmax(0, 1fr); }
  .toc { display: none; }
}
@media (max-width: 720px) {
  .layout, .layout.has-toc { grid-template-columns: 1fr; }
  .list { position: static; height: auto; max-height: 36vh; border-right: none; border-bottom: 1px solid var(--border); }
  .detail { padding: 20px 20px 64px; }
  .doc-title { font-size: 1.85rem; }
  .history { padding: 24px 20px 80px; }
  .history-head h1 { font-size: 1.85rem; }
  .history-item { grid-template-columns: 18px minmax(0, 1fr); }
  .history-time { grid-column: 2; padding-top: 0; }
  .history-body { grid-column: 2; }
}
`;
