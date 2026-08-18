import { STYLES } from "./styles.js";
import { APP_SCRIPT } from "./app-script.js";
import { ICON_SVG } from "./icon.js";

/**
 * The single-page view document. Spec list, docs-style article, and an
 * On this page outline. Theme toggle in the header (light default, dark
 * via [data-theme="dark"], persisted in localStorage). An inline pre-paint
 * script sets the theme before CSS loads to prevent a flash of the wrong
 * theme.
 */
export function renderPage(name: string): string {
  const title = `${escapeHtml(name)} Specs`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <script>
    (function() {
      var t = localStorage.getItem('specdive-theme') || 'light';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
  <style>${STYLES}</style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-lockup">
        ${ICON_SVG}
        <h1>${title}</h1>
      </div>
      <span class="divider"></span>
      <span id="status-pill" class="status-pill" title="MCP status — click to recheck">
        <span class="status-dot"></span><span class="status-label">checking…</span>
      </span>
      <span id="count" class="count"></span>
    </div>
    <span class="toolbar">
      <span class="info-tip" title="About this view" aria-label="About this view">i
        <span class="info-tip-pop">specdive shows feature specs written by your AI assistant.
          <strong>Done</strong> = done; <strong>Backlog</strong> = not done.
          Issues and security notes live in each spec's detail.</span>
      </span>
      <button id="theme-toggle" class="theme-toggle" title="Toggle theme" aria-label="Toggle theme"></button>
    </span>
  </header>
  <div id="layout" class="layout">
    <div id="list" class="list"></div>
    <div id="detail" class="detail"><div class="detail-placeholder"><p>Select a feature to see its spec.</p></div></div>
    <nav id="toc" class="toc" hidden></nav>
  </div>
  <script>${APP_SCRIPT}</script>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}
