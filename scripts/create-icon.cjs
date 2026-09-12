const fs = require('node:fs');
const path = require('node:path');

const size = 256;
const pixelBytes = size * size * 4;
const maskBytes = size * 4;
const imageSize = 40 + pixelBytes + maskBytes;
const buffer = Buffer.alloc(6 + 16 + imageSize);

buffer.writeUInt16LE(0, 0);
buffer.writeUInt16LE(1, 2);
buffer.writeUInt16LE(1, 4);
buffer.writeUInt8(size === 256 ? 0 : size, 6);
buffer.writeUInt8(size === 256 ? 0 : size, 7);
buffer.writeUInt8(0, 8);
buffer.writeUInt8(0, 9);
buffer.writeUInt16LE(1, 10);
buffer.writeUInt16LE(32, 12);
buffer.writeUInt32LE(imageSize, 14);
buffer.writeUInt32LE(22, 18);

const dib = 22;
buffer.writeUInt32LE(40, dib);
buffer.writeInt32LE(size, dib + 4);
buffer.writeInt32LE(size * 2, dib + 8);
buffer.writeUInt16LE(1, dib + 12);
buffer.writeUInt16LE(32, dib + 14);
buffer.writeUInt32LE(0, dib + 16);
buffer.writeUInt32LE(pixelBytes, dib + 20);

const pixels = dib + 40;
const edgeSize = Math.max(3, Math.round(size * .06));
const crossSize = Math.max(8, Math.round(size * .12));
const crossStart = Math.round(size / 2 - crossSize / 2);
const crossEnd = crossStart + crossSize;
const crossMin = Math.round(size * .2);
const crossMax = Math.round(size * .8);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const edge = x < edgeSize || x >= size - edgeSize || y < edgeSize || y >= size - edgeSize;
    const crosshair = (x >= crossStart && x < crossEnd && y >= crossMin && y <= crossMax) || (y >= crossStart && y < crossEnd && x >= crossMin && x <= crossMax);
    const offset = pixels + ((size - 1 - y) * size + x) * 4;
    const color = edge ? [36, 82, 145, 255] : crosshair ? [168, 197, 255, 255] : [11, 20, 37, 255];
    buffer.set(color, offset);
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'src', 'icon.ico'), buffer);
console.log('Utworzono src/icon.ico');
