import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'VERSION_MANIFEST.json'), 'utf8'));
const latest = await readFile(path.join(root, 'LATEST.md'), 'utf8').catch(() => '');
if (!manifest.latest) throw new Error('manifest latest missing');
if (!latest.includes(`V${manifest.latest}`) && manifest.latest >= 44) {
  console.warn(`⚠️ LATEST.md does not mention V${manifest.latest}; update recommended`);
}
const indexHtml = await readFile(path.join(root, 'app/public/index.html'), 'utf8');
const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
if (!footerMatch) throw new Error('index footer missing');
const footer = footerMatch[0];
const requiredFooterLinks = ['/onboarding.html', '/faq.html', '/privacy.html', '/terms.html', '/data-deletion.html'];
for (const href of requiredFooterLinks) {
  if (!footer.includes(`href="${href}"`)) throw new Error(`footer missing full-page link: ${href}`);
}
for (const badHref of ['#privacy-info', '#terms-info', '#delete-info']) {
  if (footer.includes(`href="${badHref}"`)) throw new Error(`footer legal link must point to full page, not ${badHref}`);
}
console.log(`✅ project consistency check passed latest=V${manifest.latest}`);
