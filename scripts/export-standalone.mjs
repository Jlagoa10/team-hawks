import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';

const dist = resolve('dist');
const output = resolve(process.argv[2] || 'exports/team-hawks.html');
const mime = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function embedAssets(source) {
  return source.replace(/(?<![A-Za-z0-9:/])(?:\.{1,2}\/|\/)?assets\/(?:images\/)?[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|svg|woff2?)/g, (url) => {
    const type = mime[extname(url)];
    if (!type) throw new Error(`Unsupported embedded asset: ${url}`);
    return `data:${type};base64,${readFileSync(resolve(dist, url.replace(/^(?:\.\.\/|\.\/|\/)/, ''))).toString('base64')}`;
  });
}

let html = readFileSync(resolve(dist, 'index.html'), 'utf8');
html = html.replace(/<script\b[^>]*src="((?:\.\/|\/)?assets\/[^" ]+\.js)"[^>]*><\/script>/g, (_, url) => {
  const script = embedAssets(readFileSync(resolve(dist, url.replace(/^\.?\//, '')), 'utf8')).replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${script}</script>`;
});
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="((?:\.\/|\/)?assets\/[^" ]+\.css)"[^>]*>/g, (_, url) => {
  return `<style>${embedAssets(readFileSync(resolve(dist, url.replace(/^\.?\//, '')), 'utf8'))}</style>`;
});
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '');
html = embedAssets(html);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
console.log(`Standalone site: ${output} (${Buffer.byteLength(html)} bytes)`);
