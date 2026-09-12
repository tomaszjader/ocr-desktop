const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dist = path.join(root, 'dist');
const versioned = path.join(dist, `Tekst-z-ekranu-${packageJson.version}.exe`);
const generic = path.join(dist, 'Tekst-z-ekranu.exe');

if (!fs.existsSync(versioned)) throw new Error(`Brak artefaktu ${versioned}`);
fs.copyFileSync(versioned, generic);
console.log(`Zaktualizowano ${generic}`);
