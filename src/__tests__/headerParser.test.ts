import { ShxHeaderParser } from '../headerParser';
import { ShxFileReader } from '../fileReader';
import { ShxFontType } from '../fontData';

describe('ShxHeaderParser', () => {
  let parser: ShxHeaderParser;

  beforeEach(() => {
    parser = new ShxHeaderParser();
  });

  describe('parse', () => {
    it('should parse valid header data', () => {
      // Create a buffer with a valid header
      const header = 'AutoCAD-86 shapes V1.0\r\n\x1a';
      const buffer = new ArrayBuffer(header.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < header.length; i++) {
        view[i] = header.charCodeAt(i);
      }

      const reader = new ShxFileReader(buffer);
      const result = parser.parse(reader);

      expect(result).toEqual({
        fileHeader: 'AutoCAD-86',
        fontType: ShxFontType.SHAPES,
        fileVersion: 'V1.0',
      });
    });

    it('should parse header with different font type', () => {
      const header = 'AutoCAD-86 bigfont V1.0\r\n\x1a';
      const buffer = new ArrayBuffer(header.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < header.length; i++) {
        view[i] = header.charCodeAt(i);
      }

      const reader = new ShxFileReader(buffer);
      const result = parser.parse(reader);

      expect(result).toEqual({
        fileHeader: 'AutoCAD-86',
        fontType: ShxFontType.BIGFONT,
        fileVersion: 'V1.0',
      });
    });

    it('should throw error for invalid font type', () => {
      const header = 'AutoCAD-86 INVALID V1.0\r\n\x1a';
      const buffer = new ArrayBuffer(header.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < header.length; i++) {
        view[i] = header.charCodeAt(i);
      }

      const reader = new ShxFileReader(buffer);
      expect(() => parser.parse(reader)).toThrow('Invalid font type: invalid');
    });

    it('should handle very long header within limits', () => {
      const header = 'AutoCAD-86 unifont V1.0' + ' '.repeat(900) + '\r\n\x1a';
      const buffer = new ArrayBuffer(header.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < header.length; i++) {
        view[i] = header.charCodeAt(i);
      }

      const reader = new ShxFileReader(buffer);
      const result = parser.parse(reader);

      expect(result).toEqual({
        fileHeader: 'AutoCAD-86',
        fontType: ShxFontType.UNIFONT,
        fileVersion: 'V1.0',
      });
    });
  });
});
