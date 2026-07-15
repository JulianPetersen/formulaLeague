const fs = require('fs');
const path = require('path');

const assets = [
  {
    from: path.join(__dirname, '..', 'src', 'firebase-key.json'),
    to: path.join(__dirname, '..', 'dist', 'firebase-key.json')
  }
];

for (const asset of assets) {
  if (!fs.existsSync(asset.from)) {
    throw new Error(`Build asset not found: ${asset.from}`);
  }

  fs.mkdirSync(path.dirname(asset.to), { recursive: true });
  fs.copyFileSync(asset.from, asset.to);
  console.log(`Copied ${path.relative(process.cwd(), asset.to)}`);
}
