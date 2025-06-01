import { ShxFileReader } from './fileReader';
import { ShxFontData } from './fontData';
import { ShxHeaderParser } from './headerParser';
import { ShxContentParserFactory } from './contentParser';
import { ShxShapeParser } from './shapeParser';

/**
 * Represents a SHX font and provides methods to parse and render its characters.
 * This class handles the loading and parsing of SHX font files, and provides
 * methods to extract character shapes for rendering.
 */
export class ShxFont {
  /** The parsed font data containing header and content information */
  public readonly fontData: ShxFontData;
  /** Parser for converting character codes to shapes */
  private readonly shapeParser: ShxShapeParser;

  /**
   * Creates a new ShxFont instance.
   * @param data - Either raw binary data of the SHX font file (ArrayBuffer) or pre-parsed font data (ShxFontData)
   * @throws {Error} If the font data is invalid or cannot be parsed
   */
  constructor(data: ShxFontData | ArrayBuffer) {
    if (data instanceof ArrayBuffer) {
      const reader = new ShxFileReader(data);
      const headerParser = new ShxHeaderParser();
      const header = headerParser.parse(reader);
      const contentParser = ShxContentParserFactory.createParser(header.fontType);
      const content = contentParser.parse(reader);
      this.fontData = {
        header,
        content,
      };
    } else {
      this.fontData = data;
    }
    this.shapeParser = new ShxShapeParser(this.fontData);
  }

  /**
   * Gets the shape data for a specific character at a given size.
   * @param code - The character code to get the shape for
   * @param size - The desired size of the character in drawing units
   * @returns The shape data for the character, or undefined if the character is not found in the font
   */
  public getCharShape(code: number, size: number) {
    return this.shapeParser.parse(code, size);
  }

  /**
   * Releases resources used by the font.
   * This should be called when the font is no longer needed to free up memory.
   */
  public release(): void {
    this.shapeParser.release();
  }
}
