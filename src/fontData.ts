/** Defines the text orientation type */
export type Orientation = 'horizontal' | 'vertical';

/**
 * Represents the type of SHX font file
 */
export enum ShxFontType {
  /** Standard shapes font type */
  SHAPES = 'shapes',
  /** Big font type */
  BIGFONT = 'bigfont',
  /** Unicode font type */
  UNIFONT = 'unifont',
}

/**
 * Represents the content of a SHX font file.
 * Contains the actual font data and metrics.
 */
export interface ShxFontContentData {
  /** Mapping of character codes to their bitmap data */
  data: Record<number, Uint8Array>;
  /** Additional information about the font */
  info: string;
  /** Text orientation (horizontal or vertical) */
  orientation: Orientation;
  /** Number of pixels above the baseline */
  baseUp: number;
  /** Number of pixels below the baseline */
  baseDown: number;
  /**
   * Indicates if the font is an extended big font. To reduce the size of composite Kanji
   * characters, you can define an extended Big Font file.
   */
  isExtended: boolean;
}

/**
 * Represents the header information of a SHX font file.
 * Contains metadata about the font.
 */
export interface ShxFontHeaderData {
  /** The type of font (shapes, bigfont, or unifont) */
  fontType: ShxFontType;
  /** Header information from the font file */
  fileHeader: string;
  /** Version information of the font file */
  fileVersion: string;
}

/**
 * Represents the complete data structure of a SHX font file.
 * Combines both header and content information.
 */
export interface ShxFontData {
  /** Header data of the font file */
  header: ShxFontHeaderData;
  /** Content data of the font file */
  content: ShxFontContentData;
}
