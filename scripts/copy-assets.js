import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = 'C:\\Users\\bhave\\Downloads\\SAMPLE MODELS PICTURES-20260806T131848Z-1-001\\SAMPLE MODELS PICTURES';
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public', 'sample-models');
const dataDir = path.join(rootDir, 'src', 'data');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const categoryMap = {
  'APARTMENT PICS': { name: 'Apartments', key: 'apartment', icon: 'Building2', desc: 'Luxury apartment interiors, open-plan lofts & penthouse living rooms' },
  'BATHROOM PICS': { name: 'Bathrooms', key: 'bathroom', icon: 'Bath', desc: 'Modern spa bathrooms, freestanding tubs & calacatta marble suites' },
  'BEDROOM PICS': { name: 'Bedrooms', key: 'bedroom', icon: 'Bed', desc: 'Cozy master bedrooms, upholstered headboards & sunlit suites' },
  'EXTERIOR PICS': { name: 'Exteriors', key: 'exterior', icon: 'Home', desc: 'Architectural facades, villa exteriors & modern landscape design' },
  'KITCHEN PICS': { name: 'Kitchens', key: 'kitchen', icon: 'Utensils', desc: 'Nordic minimalist kitchens, marble islands & executive culinary spaces' },
  'WASHROOM PICS': { name: 'Washrooms', key: 'washroom', icon: 'Droplets', desc: 'Compact powder rooms, microcement finishes & designer vanities' }
};

const renderEngines = ['V-Ray 6.2', 'Corona Renderer 11', 'Unreal Engine 5.4', 'Blender Cycles 4.1', 'Octane 2024'];
const formats = ['.MAX + V-Ray', '.BLEND + Cycles', '.FBX + PBR', '.OBJ + Textures'];
const polyCounts = ['850K Tris', '1.2M Tris', '1.8M Tris', '2.4M Tris', '950K Tris'];

const categoriesList = fs.readdirSync(srcDir).filter(f => fs.statSync(path.join(srcDir, f)).isDirectory());

const manifest = [];

categoriesList.forEach((catFolder, catIndex) => {
  const catMeta = categoryMap[catFolder] || { name: catFolder, key: catFolder.toLowerCase(), icon: 'Box', desc: 'High-poly 3D models' };
  const catSrc = path.join(srcDir, catFolder);
  const catDest = path.join(publicDir, catMeta.key);

  if (!fs.existsSync(catDest)) fs.mkdirSync(catDest, { recursive: true });

  const files = fs.readdirSync(catSrc).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

  // Sort files numerically if they have numbers
  files.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  files.forEach((file, fIndex) => {
    const srcFilePath = path.join(catSrc, file);
    const ext = path.extname(file);
    const safeFileName = `${catMeta.key}_${fIndex + 1}${ext}`;
    const destFilePath = path.join(catDest, safeFileName);

    fs.copyFileSync(srcFilePath, destFilePath);

    const modelId = `${catMeta.key}-${fIndex + 1}`;
    const cleanName = file.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const titleName = catMeta.name.endsWith('s') ? catMeta.name.slice(0, -1) : catMeta.name;
    const title = `${titleName} 3D Model #${fIndex + 1}`;

    manifest.push({
      id: modelId,
      title: title,
      rawName: cleanName,
      categoryKey: catMeta.key,
      categoryName: catMeta.name,
      src: `/sample-models/${catMeta.key}/${safeFileName}`,
      renderEngine: renderEngines[(fIndex + catIndex) % renderEngines.length],
      format: formats[fIndex % formats.length],
      polyCount: polyCounts[(fIndex * 3) % polyCounts.length],
      fileSize: `${(15 + (fIndex % 35)).toFixed(1)} MB`,
      featured: fIndex < 10,
    });
  });
});

const output = {
  categories: Object.values(categoryMap),
  models: manifest
};

fs.writeFileSync(path.join(dataDir, 'modelsManifest.json'), JSON.stringify(output, null, 2));

console.log('SUCCESS! Copied', manifest.length, '3D model assets into public/sample-models/ and created src/data/modelsManifest.json');
