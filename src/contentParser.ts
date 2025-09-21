import { ShxFileReader } from './fileReader';
import { ShxFontContentData, ShxFontType } from './fontData';

/**
 * Interface for parsing the content section of a SHX font file.
 * Different font types may have different parsing implementations.
 */
export interface ShxContentParser {
  /**
   * Parses the content section of a SHX font file.
   * @param reader - The file reader positioned at the start of the content section
   * @returns The parsed font content data
   */
  parse(reader: ShxFileReader): ShxFontContentData;
}

class ShxShapeContentParser implements ShxContentParser {
  parse(reader: ShxFileReader): ShxFontContentData {
    try {
      // Skip start and end codes
      reader.readBytes(4);
      const count = reader.readInt16();

      if (count <= 0) {
        throw new Error('Invalid shape count in font file');
      }

      const items: { code: number; length: number }[] = [];
      for (let i = 0; i < count; i++) {
        const code = reader.readUint16();
        const length = reader.readUint16();
        if (length > 0) {
          // Only add valid entries
          items.push({ code, length });
        }
      }

      const data: Record<number, Uint8Array> = {};
      for (const item of items) {
        try {
          const bytes = reader.readBytes(item.length);
          if (bytes.length === item.length) {
            // Parse and skip the null-terminated label at the beginning of the data
            const nulIndex = bytes.indexOf(0x00);
            let startOfBytecode = 0;
            
            // Handle the null-terminated label header
            if (nulIndex >= 0 && nulIndex < bytes.length) {
              startOfBytecode = nulIndex + 1;
            }
            
            // Only add if we got all the bytes and there's actual bytecode data
            if (startOfBytecode < bytes.length) {
              data[item.code] = bytes.subarray(startOfBytecode);
            }
          }
        } catch {
          console.warn(`Failed to read shape data for code ${item.code}`);
        }
      }

      // Set default values first
      const fontData: ShxFontContentData = {
        data,
        info: '',
        baseUp: 8, // Default values
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };

      // Try to read font info if available
      if (0 in data) {
        const infoData = data[0];
        try {
          const info = new TextDecoder().decode(infoData);
          let index = info.indexOf('\x00');
          if (index >= 0) {
            fontData.info = info.substring(0, index);
            if (index + 3 < infoData.length) {
              fontData.baseUp = infoData[index + 1];
              fontData.baseDown = infoData[index + 2];
              fontData.orientation = infoData[index + 3] === 0 ? 'horizontal' : 'vertical';
            }
          }
        } catch {
          console.warn('Failed to parse font info block');
        }
      }

      return fontData;
    } catch (e) {
      console.error('Error parsing shape font:', e);
      // Set default values if parsing fails
      return {
        data: {},
        info: 'Failed to parse font file',
        baseUp: 8,
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };
    }
  }
}

class ShxBigfontContentParser implements ShxContentParser {
  parse(reader: ShxFileReader): ShxFontContentData {
    try {
      reader.readInt16(); // item length
      const count = reader.readInt16();
      const changeNumber = reader.readInt16();

      if (count <= 0) {
        throw new Error('Invalid character count in font file');
      }

      // Skip change table
      reader.skip(changeNumber * 4);

      const items: { code: number; length: number; offset: number }[] = [];
      for (let i = 0; i < count; i++) {
        const code = reader.readUint16(false);
        const length = reader.readUint16();
        const offset = reader.readUint32();
        if (code !== 0 || length !== 0 || offset !== 0) {
          items.push({ code, length, offset });
        }
      }

      const data: Record<number, Uint8Array> = {};
      for (const item of items) {
        try {
          reader.setPosition(item.offset);
          const bytes = reader.readBytes(item.length);
          if (bytes.length === item.length) {
            data[item.code] = bytes;
          }
        } catch {
          console.warn(`Failed to read bigfont data for code ${item.code}`);
        }
      }

      // Set default values first
      const fontData: ShxFontContentData = {
        data,
        info: '',
        baseUp: 8,
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };

      // Try to read font info if available
      if (0 in data) {
        const infoData = data[0];
        try {
          const info = this.utf8ArrayToStr(infoData);
          let index = info.indexOf('\x00');
          if (index >= 0) {
            fontData.info = info.substring(0, index);
            index++;
            if (index + 3 < infoData.length) {
              if (infoData.length - index === 4) {
                fontData.baseUp = infoData[index++];
                fontData.baseDown = infoData[index++];
                fontData.orientation = infoData[index++] === 0 ? 'horizontal' : 'vertical';
              } else {
                fontData.baseUp = infoData[index++];
                index++;
                fontData.orientation = infoData[index++] === 0 ? 'horizontal' : 'vertical';
                fontData.baseDown = infoData[index++];
                fontData.isExtended = true;
              }
            }
          }
        } catch {
          console.warn('Failed to parse bigfont info block');
        }
      }

      return fontData;
    } catch (e) {
      console.error('Error parsing big font:', e);
      // Set default values if parsing fails
      return {
        data: {},
        info: 'Failed to parse font file',
        baseUp: 8,
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };
    }
  }

  private utf8ArrayToStr(array: Uint8Array): string {
    let out = '';
    let i = 0;
    while (i < array.length) {
      const c = array[i++];
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          out += String.fromCharCode(c);
          break;
        case 12:
        case 13: {
          const char2 = array[i++];
          out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
          break;
        }
        case 14: {
          const char2_14 = array[i++];
          const char3 = array[i++];
          out += String.fromCharCode(
            ((c & 0x0f) << 12) | ((char2_14 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
          );
          break;
        }
      }
    }
    return out;
  }
}

class ShxUnifontContentParser implements ShxContentParser {
  parse(reader: ShxFileReader): ShxFontContentData {
    try {
      const count = reader.readInt32();
      if (count <= 0) {
        throw new Error('Invalid character count in font file');
      }

      const infoLength = reader.readInt16();
      const infoData = reader.readBytes(infoLength);

      // Set default values first
      const fontData: ShxFontContentData = {
        data: {},
        info: '',
        baseUp: 8,
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };

      // Try to parse info data
      try {
        const info = new TextDecoder().decode(infoData);
        let index = info.indexOf('\x00');
        if (index >= 0) {
          fontData.info = info.substring(0, index);
          if (index + 3 < infoData.length) {
            fontData.baseUp = infoData[index + 1];
            fontData.baseDown = infoData[index + 2];
            fontData.orientation = infoData[index + 3] === 0 ? 'horizontal' : 'vertical';
          }
        }
      } catch {
        console.warn('Failed to parse unifont info block');
      }

      const data: Record<number, Uint8Array> = {};
      for (let i = 0; i < count - 1; i++) {
        try {
          const code = reader.readUint16();
          const length = reader.readUint16();
          if (length > 0) {
            const bytes = reader.readBytes(length);
            if (bytes.length === length) {
              // Parse and skip the null-terminated label at the beginning of the data
              const nulIndex = bytes.indexOf(0x00);
              let startOfBytecode = 0;
              
              // Handle the null-terminated label header
              if (nulIndex >= 0 && nulIndex < bytes.length) {
                startOfBytecode = nulIndex + 1;
              }
              
              // Only add if we got all the bytes and there's actual bytecode data
              if (startOfBytecode < bytes.length) {
                data[code] = bytes.subarray(startOfBytecode);
              }
            }
          }
        } catch {
          console.warn('Failed to read unifont character data');
          break;
        }
      }

      fontData.data = data;
      return fontData;
    } catch (e) {
      console.error('Error parsing unifont:', e);
      // Set default values if parsing fails
      return {
        data: {},
        info: 'Failed to parse font file',
        baseUp: 8,
        baseDown: 2,
        orientation: 'horizontal',
        isExtended: false,
      };
    }
  }
}

export class ShxContentParserFactory {
  public static createParser(fontType: ShxFontType): ShxContentParser {
    switch (fontType) {
      case ShxFontType.SHAPES:
        return new ShxShapeContentParser();
      case ShxFontType.BIGFONT:
        return new ShxBigfontContentParser();
      case ShxFontType.UNIFONT:
        return new ShxUnifontContentParser();
      default:
        throw new Error(`Unsupported font type: ${fontType}`);
    }
  }
}
