import fs from 'fs';
import path from 'path';

const distDir = './dist';
const repoPrefix = '/rostrodorado-go/';

const targets = [
  'images/',
  'payments/',
  'favicon.ico',
  're.ico',
  'sitemap.xml',
  'robots.txt'
];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

console.log('[Path Fix] Adjusting asset paths for GitHub Pages...');

walk(distDir, filePath => {
  if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    targets.forEach(target => {
      // Create regex for "/target and '/target
      const doubleQuoteRegex = new RegExp(`"\\/${target}`, 'g');
      const singleQuoteRegex = new RegExp(`'\\/${target}`, 'g');

      content = content.replace(doubleQuoteRegex, `"${repoPrefix}${target}`);
      content = content.replace(singleQuoteRegex, `'${repoPrefix}${target}`);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Path Fix] Fixed paths in: ${filePath}`);
    }
  }
});

console.log('[Path Fix] Completed.');
