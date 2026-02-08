const fs = require('fs');
const path = require('path');

// Función para crear PNG de color sólido con tamaño específico
function createColoredPNG(width, height, color) {
  // Colores RGB para azul (similar a theme-color del manifest)
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;

  let png = Buffer.alloc(8 + 25 + 12 + (height * (width * 4 + 1)) + 12);
  let offset = 0;

  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  sig.copy(png, offset);
  offset += 8;

  // IHDR chunk
  png.writeUInt32BE(13, offset); offset += 4;
  png.write('IHDR', offset, 'ascii'); offset += 4;
  png.writeUInt32BE(width, offset); offset += 4;
  png.writeUInt32BE(height, offset); offset += 4;
  offset += 5; // bit depth, color type, etc
  png[offset - 5] = 8; // 8-bit
  png[offset - 4] = 2; // Truecolor
  png[offset - 3] = 0; // Compression
  png[offset - 2] = 0; // Filter
  png[offset - 1] = 0; // Interlace

  // Simple CRC (placeholder)
  png.writeUInt32BE(0, offset); offset += 4;

  // IDAT chunk (simplified)
  let dataLen = height * (width * 4 + 1) + 2;
  png.writeUInt32BE(dataLen, offset); offset += 4;
  png.write('IDAT', offset, 'ascii'); offset += 4;
  
  // Write scanlines
  for (let y = 0; y < height; y++) {
    png[offset] = 0; // filter type: none
    offset++;
    for (let x = 0; x < width; x++) {
      png[offset++] = r;
      png[offset++] = g;
      png[offset++] = b;
      png[offset++] = 255; // alpha
    }
  }
  offset += 2; // compression trailer

  png.writeUInt32BE(0, offset); offset += 4; // CRC

  // IEND chunk
  png.writeUInt32BE(0, offset); offset += 4;
  png.write('IEND', offset, 'ascii'); offset += 4;
  png.writeUInt32BE(0xae426082, offset); offset += 4;

  return png.slice(0, offset);
}

const publicDir = path.resolve(__dirname, '../public');
const color = 0x3b82f6; // theme_color from manifest

const images = [
  { name: 'icon-192x192.png', width: 192, height: 192 },
  { name: 'icon-192x192-maskable.png', width: 192, height: 192 },
  { name: 'icon-512x512.png', width: 512, height: 512 },
  { name: 'icon-512x512-maskable.png', width: 512, height: 512 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
  { name: 'screenshot-540x720.png', width: 540, height: 720 },
  { name: 'screenshot-1280x720.png', width: 1280, height: 720 }
];

images.forEach(img => {
  try {
    const pngData = createColoredPNG(img.width, img.height, color);
    fs.writeFileSync(path.join(publicDir, img.name), pngData);
    console.log(`✅ ${img.name} (${img.width}x${img.height}) creada`);
  } catch (e) {
    console.log(`❌ Error en ${img.name}: ${e.message}`);
  }
});

console.log('\n✅ Todas las imágenes han sido creadas.');
