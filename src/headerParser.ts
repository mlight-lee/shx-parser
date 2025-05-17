import { ShxFileReader } from './fileReader';
import { ShxFontHeaderData, ShxFontType } from './fontData';

/**
 * Parses the header of a SHX font file
 */
export class ShxHeaderParser {
  parse(reader: ShxFileReader): ShxFontHeaderData {
    const headerData = this.parseHeader(reader);
    const headers = headerData.split(' ');

    const fontType = headers[1].toLocaleLowerCase() as ShxFontType;
    if (!Object.values(ShxFontType).includes(fontType)) {
      throw new Error(`Invalid font type: ${fontType}`);
    }

    return {
      fileHeader: headers[0],
      fontType,
      fileVersion: headers[2],
    };
  }

  private parseHeader(reader: ShxFileReader): string {
    let result = '';
    const maxHeaderLength = 1024; // Prevent infinite loop
    let headerLength = 0;

    while (reader.currentPosition < reader.length - 2 && headerLength < maxHeaderLength) {
      const byte1 = reader.readUint8();
      if (byte1 === 0x0d) {
        // Peek next two bytes without advancing the position
        const currentPos = reader.currentPosition;
        const byte2 = reader.readUint8();
        const byte3 = reader.readUint8();

        if (byte2 === 0x0a && byte3 === 0x1a) {
          break;
        }

        // If sequence doesn't match, reset position and add the first byte to result
        reader.setPosition(currentPos);
        result += String.fromCharCode(byte1);
      } else {
        result += String.fromCharCode(byte1);
      }
      headerLength++;
    }

    return result.trim();
  }
}
