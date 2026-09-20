const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// Windows uses different icon sizes for the executable, taskbar, Alt+Tab and
// notification area. Supplying every common size prevents it from falling
// back to Electron's icon or resampling a single 256 px image poorly.
const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
const samplesPerAxis = 4;

const palette = {
  background: [19, 35, 64, 255],
  border: [59, 95, 152, 255],
  mark: [168, 197, 255, 255]
};

function insideRoundedSquare(x, y, size, inset, radius) {
  const half = size / 2 - inset;
  const inner = half - radius;
  const dx = Math.abs(x - size / 2) - inner;
  const dy = Math.abs(y - size / 2) - inner;
  const distance = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  return distance <= radius;
}

function between(value, min, max) {
  return value >= min && value <= max;
}

function isScanMark(x, y, size) {
  const low = size * .285;
  const high = size * .715;
  const arm = size * .19;
  const halfStroke = Math.max(.65, size * .035);

  return (
    (between(x, low, low + arm) && Math.abs(y - low) <= halfStroke) ||
    (Math.abs(x - low) <= halfStroke && between(y, low, low + arm)) ||
    (between(x, high - arm, high) && Math.abs(y - low) <= halfStroke) ||
    (Math.abs(x - high) <= halfStroke && between(y, low, low + arm)) ||
    (between(x, low, low + arm) && Math.abs(y - high) <= halfStroke) ||
    (Math.abs(x - low) <= halfStroke && between(y, high - arm, high)) ||
    (between(x, high - arm, high) && Math.abs(y - high) <= halfStroke) ||
    (Math.abs(x - high) <= halfStroke && between(y, high - arm, high))
  );
}

function createDib(size) {
  const pixelBytes = size * size * 4;
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const maskBytes = maskRowBytes * size;
  const dib = Buffer.alloc(40 + pixelBytes + maskBytes);

  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(size, 4);
  dib.writeInt32LE(size * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(0, 16);
  dib.writeUInt32LE(pixelBytes + maskBytes, 20);

  const outerInset = size * .045;
  const outerRadius = size * .205;
  const borderWidth = Math.max(1, size * .035);
  const innerInset = outerInset + borderWidth;
  const innerRadius = Math.max(0, outerRadius - borderWidth);
  const sampleCount = samplesPerAxis * samplesPerAxis;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let sampleY = 0; sampleY < samplesPerAxis; sampleY++) {
        for (let sampleX = 0; sampleX < samplesPerAxis; sampleX++) {
          const px = x + (sampleX + .5) / samplesPerAxis;
          const py = y + (sampleY + .5) / samplesPerAxis;
          if (!insideRoundedSquare(px, py, size, outerInset, outerRadius)) continue;

          const color = isScanMark(px, py, size)
            ? palette.mark
            : insideRoundedSquare(px, py, size, innerInset, innerRadius)
              ? palette.background
              : palette.border;
          const sampleAlpha = color[3] / 255;
          alpha += sampleAlpha;
          red += color[0] * sampleAlpha;
          green += color[1] * sampleAlpha;
          blue += color[2] * sampleAlpha;
        }
      }

      const coverage = alpha / sampleCount;
      const offset = 40 + ((size - 1 - y) * size + x) * 4;
      if (alpha > 0) {
        // ICO DIB pixels are stored as BGRA, not RGBA.
        dib[offset] = Math.round(blue / alpha);
        dib[offset + 1] = Math.round(green / alpha);
        dib[offset + 2] = Math.round(red / alpha);
        dib[offset + 3] = Math.round(coverage * 255);
      }
    }
  }

  return dib;
}

function crc32(buffer) {
  let checksum = 0xffffffff;
  for (const byte of buffer) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit++) checksum = (checksum >>> 1) ^ (0xedb88320 & -(checksum & 1));
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBytes, data]);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([length, payload, checksum]);
}

function createPng(size) {
  const rows = [];
  const outerInset = size * .045;
  const outerRadius = size * .205;
  const borderWidth = Math.max(1, size * .035);
  const innerInset = outerInset + borderWidth;
  const innerRadius = Math.max(0, outerRadius - borderWidth);
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    rows.push(row);
    for (let x = 0; x < size; x++) {
      const offset = 1 + x * 4;
      let color = [0, 0, 0, 0];
      if (insideRoundedSquare(x + .5, y + .5, size, outerInset, outerRadius)) {
        color = isScanMark(x + .5, y + .5, size)
          ? palette.mark
          : insideRoundedSquare(x + .5, y + .5, size, innerInset, innerRadius)
            ? palette.background
            : palette.border;
      }
      row[offset] = color[0];
      row[offset + 1] = color[1];
      row[offset + 2] = color[2];
      row[offset + 3] = color[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.writeUInt8(8, 8); // 8 bits per channel
  header.writeUInt8(6, 9); // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

const images = sizes.map(size => ({ size, data: createDib(size) }));
const directorySize = 6 + images.length * 16;
const header = Buffer.alloc(directorySize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let imageOffset = directorySize;
images.forEach(({ size, data }, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size === 256 ? 0 : size, entry);
  header.writeUInt8(size === 256 ? 0 : size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(imageOffset, entry + 12);
  imageOffset += data.length;
});

const output = path.join(__dirname, '..', 'src', 'assets', 'icon.ico');
fs.writeFileSync(output, Buffer.concat([header, ...images.map(image => image.data)]));
fs.writeFileSync(path.join(__dirname, '..', 'src', 'assets', 'icon.png'), createPng(1024));
console.log(`Utworzono ${output} (${sizes.join(', ')} px)`);
