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
   * Creates a new ShxFont instance from binary font data.
   * @param fileData - The raw binary data of the SHX font file
   */
  constructor(fileData: ArrayBuffer) {
    const reader = new ShxFileReader(fileData);
    const headerParser = new ShxHeaderParser();
    const header = headerParser.parse(reader);
    const contentParser = ShxContentParserFactory.createParser(header.fontType);
    const content = contentParser.parse(reader);
    this.fontData = {
      header,
      content,
    };
    this.shapeParser = new ShxShapeParser(this.fontData);
  }

  /**
   * Gets the shape data for a specific character at a given size.
   * @param code - The character code to get the shape for
   * @param size - The desired size of the character
   * @returns The shape data for the character, or undefined if not found
   */
  public getCharShape(code: number, size: number) {
    return this.shapeParser.parse(code, size);
  }

  /**
   * Releases resources used by the font.
   * This should be called when the font is no longer needed.
   */
  public release(): void {
    this.shapeParser.release();
  }
}
