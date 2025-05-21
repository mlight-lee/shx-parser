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
    baseUp: number;           // Pixels above baseline
    baseDown: number;         // Pixels below baseline
  };
}
```

## Examples

### Loading a Font File

```typescript
import { readFile } from 'fs/promises';
import { ShxFont } from '@mlightcad/shx-parser';

async function loadFont(filePath: string) {
  const buffer = await readFile(filePath);
  const font = new ShxFont(buffer.buffer);
  return font;
}
```

### Rendering Text Shape as SVG

```typescript
function renderTextToSvg(font: ShxFont, text: string, size: number, options = {
  width: 1000,
  height: 1000,
  scale: 40,
  strokeWidth: 2,
  strokeColor: 'black'
}) {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', options.width.toString());
  svg.setAttribute('height', options.height.toString());
  svg.setAttribute('viewBox', `0 0 ${options.width} ${options.height}`);

  let x = 0;
  
  for (const char of text) {
    const shape = font.getCharShape(char.charCodeAt(0), size);
    if (shape) {
      // Create path for each polyline in the shape
      shape.polylines.forEach(polyline => {
        let d = '';
        polyline.forEach((point, index) => {
          // Center the text and scale it
          const px = (point.x + x) * options.scale + options.width / 2;
          const py = -point.y * options.scale + options.height / 2;
          d += index === 0 ? `M ${px} ${py} ` : `L ${px} ${py} `;
        });

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', options.strokeColor);
        path.setAttribute('stroke-width', options.strokeWidth.toString());
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      });
      
      x += shape.lastPoint.x; // Move x position for next character
    }
  }
  
  return svg;
}

// Example usage:
const font = new ShxFont(fontFileData);
const svgElement = renderTextToSvg(font, "Hello", 12);
document.body.appendChild(svgElement);
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
