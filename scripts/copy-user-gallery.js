import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\bhave\\.gemini\\antigravity\\brain\\28007b11-388b-4486-8fc8-f1bac7f2090e\\.user_uploaded';
const targetDir = 'C:\\Users\\bhave\\.gemini\\antigravity\\scratch\\coverflow-3d-renders\\public\\gallery-renders';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = [
  'media__1786285550576.jpg',
  'media__1786285556061.jpg',
  'media__1786285562137.jpg',
  'media__1786285565123.jpg',
  'media__1786285569694.jpg'
];

files.forEach((file, index) => {
  const src = path.join(srcDir, file);
  const dest = path.join(targetDir, `render_${index + 1}.jpg`);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} -> render_${index + 1}.jpg`);
});
