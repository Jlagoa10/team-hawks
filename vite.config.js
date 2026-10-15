import { defineConfig } from 'vite';
import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const root = import.meta.dirname;
const manifestPath = resolve(root, 'src/video-manifest.json');
const readManifest = () => JSON.parse(readFileSync(manifestPath, 'utf8'));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function localVideoExists(entry) {
  if (/^[a-z]+:/i.test(entry.src)) return false;
  const file = resolve(root, 'public', entry.src.replace(/^\.?\//, ''));
  const path = relative(resolve(root, 'public'), file);
  if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) return false;
  try {
    const stats = statSync(file);
    return stats.isFile() && stats.size > 0;
  } catch { return false; }
}

export default defineConfig({
  base: './',
  server: { watch: { ignored: ['**/exports/**', '**/test-results/**', '**/playwright-report/**'] } },
  plugins: [{
    name: 'team-hawks-video-manifest',
    // Local files are discovered at build/start; absent clips create no requests.
    resolveId(id) { if (id === 'virtual:team-hawks-videos') return '\0team-hawks-videos'; },
    load(id) {
      if (id !== '\0team-hawks-videos') return;
      return `export default ${JSON.stringify(readManifest().filter(localVideoExists).map((entry) => entry.id))};`;
    },
    configureServer(server) {
      server.watcher.add(manifestPath);
      server.watcher.add(resolve(root, 'public/assets/videos'));
      server.watcher.on('all', (_event, file) => {
        if (file === manifestPath || file.startsWith(resolve(root, 'public/assets/videos'))) {
          const module = server.moduleGraph.getModuleById('\0team-hawks-videos');
          if (module) server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!-- videos:(training|action|events) -->/g, (_, group) => {
          return readManifest().filter((entry) => entry.group === group).map((entry) => {
            const id = escapeHTML(entry.id);
            const ratio = /^(16\s*\/\s*9|9\s*\/\s*16)$/.test(entry.ratio) ? entry.ratio : '16 / 9';
            return `<article class="video-card" data-video-id="${id}" data-status="pending" aria-labelledby="${id}-title">
              <div class="video-heading"><span class="eyebrow" aria-hidden="true">${id.slice(-2)}</span><h3 id="${id}-title" class="display">${escapeHTML(entry.title)}</h3></div>
              <div class="video-frame${ratio.trim().startsWith('9') ? ' video-frame--portrait' : ''}" style="--video-ratio:${ratio}"><p class="video-pending">VÍDEO EM BREVE</p></div>
              ${entry.description ? `<p class="video-description">${escapeHTML(entry.description)}</p>` : ''}
            </article>`;
          }).join('\n');
        });
      },
    },
  }],
});
