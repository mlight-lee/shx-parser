/**
 * Represents a value that can be encoded into bytes.
 * Can be a string, number, or boolean.
 */
export type ShxEncodableValue = string | number | boolean;

/**
 * Represents a value or array of values that can be encoded into bytes.
 * Can be either a single encodable value or an array of encodable values.
 */
export type ShxEncodable = ShxEncodableValue | ShxEncodableValue[];

/**
 * Provides utilities for working with binary data in the SHX format.
 */
export class ShxByteEncoder {
  /** DataView instance used for reading and writing binary data */
  private dataView: DataView;

  /**
   * Creates a new ShxByteEncoder instance.
   * @param buffer - The ArrayBuffer to read from/write to
   */
  constructor(buffer: ArrayBuffer) {
    this.dataView = new DataView(buffer);
  }

  /**
   * Converts a value to its byte representation according to SHX encoding rules.
   * Handles strings (UTF-8), numbers (int32/float64), booleans, and arrays of these types.
   * @param value - The value to convert to bytes
   * @returns A Uint8Array containing the byte representation
   * @throws Error if the value type is not supported
   */
  public static getBytes(value: ShxEncodable): Uint8Array {
    if (typeof value === 'string') {
      return new TextEncoder().encode(value);
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value) && value <= 2147483647) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setInt32(0, value, true);
        return new Uint8Array(buffer);
      }
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, value, true);
      return new Uint8Array(buffer);
    }
    if (typeof value === 'boolean') {
      return new Uint8Array([value ? 1 : 0]);
    }
    if (Array.isArray(value)) {
      const arrays = value.map(v => ShxByteEncoder.getBytes(v));
      const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    }
    throw new Error('Unsupported type for byte conversion');
  }

  /**
   * Creates a new encoder from a Uint8Array.
   * @param array - The Uint8Array to create the encoder from
   * @returns A new ShxByteEncoder instance
   */
  public static fromUint8Array(array: Uint8Array): ShxByteEncoder {
    return new ShxByteEncoder(array.buffer);
  }

  /**
   * Converts an unsigned byte to a signed byte as used in SHX format.
   * Values > 127 are converted to their signed equivalent (-128 to -1).
   * @param value - The unsigned byte value to convert
   * @returns The signed byte value
   */
  public static byteToSByte(value: number): number {
    return value > 127 ? value - 256 : value;
  }

  /**
   * Reads a boolean value from the specified offset.
   * @param offset - The offset to read from (defaults to 0)
   * @returns The boolean value (true if non-zero, false if zero)
   */
  public toBoolean(offset: number = 0): boolean {
    return this.dataView.getUint8(offset) !== 0;
  }

  /**
   * Reads a signed 32-bit integer from the specified offset.
   * @param offset - The offset to read from (defaults to 0)
   * @returns The int32 value
   */
  public toInt32(offset: number = 0): number {
    return this.dataView.getInt32(offset, true);
  }

  /**
   * Reads an unsigned 16-bit integer from the specified offset.
   * @param offset - The offset to read from (defaults to 0)
   * @returns The uint16 value
   */
  public toUint16(offset: number = 0): number {
    return this.dataView.getUint16(offset, true);
  }

  /**
   * Reads an unsigned 32-bit integer from the specified offset.
   * @param offset - The offset to read from (defaults to 0)
   * @returns The uint32 value
   */
  public toUint32(offset: number = 0): number {
    return this.dataView.getUint32(offset, true);
  }

  /**
   * Reads a 64-bit floating point number from the specified offset.
   * @param offset - The offset to read from (defaults to 0)
   * @returns The float64 value
   */
  public toFloat64(offset: number = 0): number {
    return this.dataView.getFloat64(offset, true);
  }
}
