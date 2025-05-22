# SHX Parser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@mlightcad%2Fshx-parser.svg)](https://badge.fury.io/js/@mlightcad/shx-parser)
[![CI/CD](https://github.com/shx-parser/shx-parser/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/shx-parser/shx-parser/actions/workflows/ci-cd.yml)

A TypeScript library for parsing AutoCAD SHX font files. It is ported from [this project](https://github.com/yzylovepmn/YFonts.SHX) written by C#. This project fixed many bugs on the original parser. Moreover, support parsing [extended big font](https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-00ED0CC6-A4BE-4591-93FA-598CC40AA43D).

If you are interested in the format of SHX font, please refer to [this document](https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-06832147-16BE-4A66-A6D0-3ADF98DC8228).

## Features

- Parse SHX font files and extract font data
- Support for various SHX font types:
  - Shapes
  - Bigfont (including Extended Big Font)
  - Unifont
- Shape parsing with performance optimization:
  - On-demand parsing
  - Shape caching by character code and size
- Modern TypeScript implementation
- Object-oriented design
- Comprehensive test coverage

## Installation

Using npm:
```bash
npm install @mlightcad/shx-parser
```

Using pnpm:
```bash
pnpm add @mlightcad/shx-parser
```

Using yarn:
```bash
yarn add @mlightcad/shx-parser
```

## Demo app

The [demo app](https://mlight-lee.github.io/shx-parser/) is provided with a web-based interface for viewing and exploring SHX font files with the following features:

- **Dual Loading Modes**:
  - Upload local SHX files
  - Select from a remote font library

- **Main Features**:
  - View all characters in a responsive grid layout
  - Search characters by code (decimal/hex)
  - Click characters to see them in a larger modal view
  - Toggle between decimal and hexadecimal code display

- **Display Information**:
  - Shows font type, version, and character count
  - Renders characters as SVG graphics
  - Responsive grid layout that works on different screen sizes


## Quick Start

```typescript
import { ShxFont } from '@mlightcad/shx-parser';

// Load the font file
const fontFileData = /* ArrayBuffer containing SHX font file data */;
const font = new ShxFont(fontFileData);

// Get shape for a character
const charCode = 65; // ASCII code for 'A'
const fontSize = 12;
const shape = font.getCharShape(charCode, fontSize);

if (shape) {
  console.log(shape.polylines); // Array of polylines representing the character
  console.log(shape.lastPoint); // End point of the character
}

// Clean up resources when done
font.release();
```

## API Documentation

### `ShxFont`

The main class for working with SHX fonts.

```typescript
class ShxFont {
  fontData: ShxFontData;
  constructor(data: ArrayBuffer);
  getCharShape(charCode: number, size: number): ShxShape | null;
  release(): void;
}
```

### `ShxShape`

Represents a parsed character shape.

```typescript
interface ShxShape {
  polylines: Array<{ x: number; y: number }[]>;  // Array of polyline points
  lastPoint: { x: number; y: number };           // End point of the shape
}
```

### Font Data Structure

The library parses SHX font files into the following structure:

```typescript
interface ShxFontData {
  header: {
    fontType: ShxFontType;     // 'shapes' | 'bigfont' | 'unifont'
    fileHeader: string;        // Font file header information
    fileVersion: string;       // Font file version
  };
  content: {
    data: Record<number, Uint8Array>;  // Character code to bitmap data mapping
    info: string;              // Additional font information
    orientation: string;       // Text orientation ('horizontal' | 'vertical')
    baseUp: number;            // Pixels above baseline
    baseDown: number;          // Pixels below baseline
    isExtended: boolean;       // Flag to indicate if the font is an extended big font
  };
}
```

## Example

### Loading and Displaying Font Information

```typescript
import { readFile } from 'fs/promises';
import { ShxFont } from '@mlightcad/shx-parser';

async function loadFont(filePath: string) {
  const buffer = await readFile(filePath);
  const font = new ShxFont(buffer.buffer);
  
  // Display font information
  const fontData = font.fontData;
  console.log('Font Information:');
  console.log('----------------');
  console.log('Font Type:', fontData.header.fontType);
  console.log('Header:', fontData.header.fileHeader);
  console.log('Version:', fontData.header.fileVersion);
  console.log('Info:', fontData.content.info);
  console.log('Orientation:', fontData.content.orientation);
  console.log('Base Up:', fontData.content.baseUp);
  console.log('Base Down:', fontData.content.baseDown);
  console.log('Number of shapes:', Object.keys(fontData.content.data).length);
  
  return font;
}
```

### Converting Shape to SVG Path

```typescript
function shapeToSvgPath(shape: ShxShape, x: number = 0, y: number = 0): string {
  if (!shape?.polylines.length) return '';
  
  return shape.polylines.map(polyline => {
    if (!Array.isArray(polyline) || polyline.length === 0) return '';
    
    return polyline.map((point, i) => {
      const scaledX = (Number(point.x) || 0) + x;
      const scaledY = -(Number(point.y) || 0) + y; // Flip Y coordinate for SVG
      const command = i === 0 ? 'M' : 'L';
      return `${command} ${scaledX.toFixed(2)} ${scaledY.toFixed(2)}`;
    }).join(' ');
  }).filter(Boolean).join(' ');
}
```

### Rendering Text to SVG

```typescript
interface SvgOptions {
  width?: number;
  height?: number;
  strokeWidth?: string;
  strokeColor?: string;
  isAutoFit?: boolean;
}

function renderTextToSvg(
  font: ShxFont, 
  text: string, 
  size: number, 
  options: SvgOptions = {}
): SVGElement {
  const {
    width = 1000,
    height = 1000,
    strokeWidth = '0.1%',
    strokeColor = 'black',
    isAutoFit = false
  } = options;

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const padding = size;
  let currentX = padding;
  let maxHeight = 0;

  // Process each character
  for (const char of text) {
    const charCode = char.charCodeAt(0);
    const shape = font.getCharShape(charCode, size);
    
    if (shape) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      if (isAutoFit) {
        // Auto-fit positioning
        const bbox = shape.bbox;
        const padding = 0.2; // 20% padding
        const width = bbox.maxX - bbox.minX;
        const height = bbox.maxY - bbox.minY;
        const centerX = (bbox.minX + bbox.maxX) / 2;
        const centerY = (bbox.minY + bbox.maxY) / 2;
        group.setAttribute('transform', `translate(${currentX - centerX}, ${-centerY})`);
      } else {
        // Fixed positioning
        group.setAttribute('transform', `translate(${currentX + width / 2}, ${height / 2})`);
      }

      // Create path for the character
      const pathData = shapeToSvgPath(shape);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', strokeWidth);
      
      group.appendChild(path);
      svg.appendChild(group);

      // Update position for next character
      if (shape.lastPoint) {
        currentX += shape.lastPoint.x + size * 0.5;
      } else {
        currentX += size;
      }
      
      maxHeight = Math.max(maxHeight, size);
    }
  }

  return svg;
}

// Example usage:
async function main() {
  try {
    const font = await loadFont('path/to/your/font.shx');
    
    // Example 1: Basic rendering
    const svgElement1 = renderTextToSvg(font, "Hello", 12);
    document.body.appendChild(svgElement1);
    
    // Example 2: Auto-fit rendering with custom options
    const svgElement2 = renderTextToSvg(font, "Hello", 12, {
      width: 1000,
      height: 1000,
      strokeWidth: '0.1%',
      strokeColor: 'black',
      isAutoFit: true
    });
    document.body.appendChild(svgElement2);
    
    // Clean up resources when done
    font.release();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or run into issues, please:
1. Check the [GitHub Issues](https://github.com/shx-parser/shx-parser/issues) page
2. Open a new issue if your problem hasn't been reported yet
