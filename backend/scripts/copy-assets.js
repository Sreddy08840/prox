const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Only copy .txt files (prompts)
    if (src.endsWith('.txt')) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`Copied asset: ${path.relative(path.join(__dirname, '..'), src)} -> ${path.relative(path.join(__dirname, '..'), dest)}`);
    }
  }
}

const srcPath = path.join(__dirname, '../src');
const destPath = path.join(__dirname, '../dist');
copyRecursive(srcPath, destPath);
