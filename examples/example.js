import { ShxFont } from './dist/index.es.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert shape data to SVG path data
function shapeToSvgPath(shape, x = 0, y = 0) {
  if (!shape || !shape.polylines.length) return '';
  
  // Debug log to check shape data
  console.log('Shape data:', JSON.stringify(shape, null, 2));
  
  return shape.polylines.map(polyline => {
    if (!Array.isArray(polyline) || polyline.length === 0) return '';
    
    const points = polyline.map((point, i) => {
      // Ensure we have valid numbers and scale them
      const scaledX = (Number(point.x) || 0) + x;
      const scaledY = -(Number(point.y) || 0) + y; // Flip Y coordinate for SVG
      const command = i === 0 ? 'M' : 'L';
      return `${command} ${scaledX.toFixed(2)} ${scaledY.toFixed(2)}`;
    }).filter(Boolean).join(' ');
    
    return points;
  }).filter(Boolean).join(' ');
}

// Generate SVG content for a string
function generateSvg(text, shapes, size) {
  const padding = size;
  let currentX = padding;
  let maxHeight = 0;
  
  // Debug log to check shapes
  console.log('Text:', text);
  console.log('Number of shapes:', shapes.length);
  
  // Create a map of character codes to shapes
  const shapeMap = new Map();
  shapes.forEach((shape, index) => {
    const charCode = text.charCodeAt(index);
    shapeMap.set(charCode, shape);
  });
  
  // Calculate dimensions and create paths
  const paths = Array.from(text).map((char, i) => {
    const charCode = char.charCodeAt(0);
    const shape = shapeMap.get(charCode);
    
    if (!shape) {
      console.warn(`No shape found for character '${char}' (code: ${charCode})`);
      return '';
    }
    
    const pathData = shapeToSvgPath(shape, currentX, padding);
    if (!pathData) {
      console.warn(`Empty path data for character '${char}' (code: ${charCode})`);
      return '';
    }
    
    // Update position for next character
    if (shape.lastPoint && Array.isArray(shape.lastPoint) && shape.lastPoint.length >= 2) {
      currentX += (Number(shape.lastPoint[0]) || 0) + size * 0.5;
    } else {
      currentX += size; // Fallback spacing if lastPoint is invalid
    }
    
    maxHeight = Math.max(maxHeight, size);
    return `<path d="${pathData}" fill="none" stroke="black" stroke-width="1"/>`;
  }).filter(Boolean);

  const width = currentX + padding;
  const height = maxHeight + padding * 2;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${paths.join('\n  ')}
</svg>`;
}

// Example usage
async function main() {
  try {
    // Read the ISO.shx file from the data folder
    const filePath = path.join(__dirname, '../data/ISO.shx');
    console.log('Reading font file:', filePath);
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log('File size:', fileBuffer.length, 'bytes');
    
    // Create font instance from the file
    const font = new ShxFont(fileBuffer.buffer);

    // Get font information
    const fontData = font.fontData;
    console.log('\nFont Information:');
    console.log('----------------');
    console.log('Font Type:', fontData.header.fontType);
    console.log('Header:', fontData.header.fileHeader);
    console.log('Version:', fontData.header.fileVersion);
    console.log('Info:', fontData.content.info);
    console.log('Orientation:', fontData.content.orientation);
    console.log('Base Up:', fontData.content.baseUp);
    console.log('Base Down:', fontData.content.baseDown);
    console.log('Number of shapes:', Object.keys(fontData.content.data).length);
    console.log('Available codes:', Object.keys(fontData.content.data).join(', '));
    console.log('----------------\n');

    // Example: Generate SVG for a text string
    const text = 'ABCDEF123';
    const size = 12;

    console.log(`Generating SVG for text: ${text}`);
    
    // Get shapes for each character
    const shapes = Array.from(text).map(char => {
      const code = char.charCodeAt(0);
      return font.getCharShape(code, size);
    });

    // Generate SVG content
    const svgContent = generateSvg(text, shapes, size);
    
    // Save SVG to file
    const outputPath = path.join(__dirname, 'output.svg');
    fs.writeFileSync(outputPath, svgContent);
    console.log(`SVG file saved to: ${outputPath}`);

    // Clean up resources
    font.release();
  } catch (error) {
    if (error instanceof Error) {
      if (error.code === 'ENOENT') {
        console.error('Error: ISO.shx file not found in data folder');
      } else {
        console.error('Error:', error.message);
      }
    } else {
      console.error('An unknown error occurred');
    }
  }
}

// Run the example
main().catch(console.error);