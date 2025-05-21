/**
 * A utility class for reading binary data from an ArrayBuffer.
 * Provides methods to read various data types and manage the read position.
 */
export class ShxFileReader {
  /** Current position in the buffer */
  private position: number;
  /** DataView instance for reading binary data */
  private data: DataView;

  /**
   * Creates a new ShxFileReader instance.
   * @param arraybuffer - The ArrayBuffer to read from
   */
  constructor(arraybuffer: ArrayBuffer) {
    this.position = 0;
    this.data = new DataView(arraybuffer);
  }

  /**
   * Reads a specified number of bytes from the current position.
   * @param length - Number of bytes to read (optional)
   * @returns A Uint8Array containing the read bytes
   * @throws Error if reading beyond buffer bounds
   */
  readBytes(length: number = 1): Uint8Array {
    if (this.data.byteLength < this.position + length) {
      this.throwOutOfRangeError(this.position + length);
    }
    const result = new Uint8Array(this.data.buffer, this.position, length);
    this.position += length;
    return result;
  }

  /**
   * Skips a specified number of bytes from the current position.
   * @param length - Number of bytes to skip
   * @throws Error if skipping beyond buffer bounds
   */
  skip(length: number): void {
    if (this.data.byteLength < this.position + length) {
      this.throwOutOfRangeError(this.position + length);
    }
    this.position += length;
  }

  /**
   * Reads an unsigned 8-bit integer.
   * @returns The read uint8 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint8(): number {
    if (this.data.byteLength < this.position + 1) {
      this.throwOutOfRangeError(this.position + 1);
    }
    const result = this.data.getUint8(this.position);
    this.position += 1;
    return result;
  }

  /**
   * Reads a signed 8-bit integer.
   * @returns The read int8 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt8(): number {
    if (this.data.byteLength < this.position + 1) {
      this.throwOutOfRangeError(this.position + 1);
    }
    const result = this.data.getInt8(this.position);
    this.position += 1;
    return result;
  }

  /**
   * Reads an unsigned 16-bit integer.
   * @param littleEndian If false, a big-endian value should be read.
   * @returns The read uint16 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint16(littleEndian: boolean = true): number {
    if (this.data.byteLength < this.position + 2) {
      this.throwOutOfRangeError(this.position + 2);
    }
    const result = this.data.getUint16(this.position, littleEndian);
    this.position += 2;
    return result;
  }

  /**
   * Reads a signed 16-bit integer.
   * @returns The read int16 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt16(): number {
    if (this.data.byteLength < this.position + 2) {
      this.throwOutOfRangeError(this.position + 2);
    }
    const result = this.data.getInt16(this.position, true);
    this.position += 2;
    return result;
  }

  /**
   * Reads an unsigned 32-bit integer.
   * @returns The read uint32 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint32(): number {
    if (this.data.byteLength < this.position + 4) {
      this.throwOutOfRangeError(this.position + 4);
    }
    const result = this.data.getUint32(this.position, true);
    this.position += 4;
    return result;
  }

  /**
   * Reads a signed 32-bit integer.
   * @returns The read int32 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt32(): number {
    if (this.data.byteLength < this.position + 4) {
      this.throwOutOfRangeError(this.position + 4);
    }
    const result = this.data.getInt32(this.position, true);
    this.position += 4;
    return result;
  }

  /**
   * Reads a 32-bit floating point number.
   * @returns The read float32 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat32(): number {
    if (this.data.byteLength < this.position + 4) {
      this.throwOutOfRangeError(this.position + 4);
    }
    const result = this.data.getFloat32(this.position, true);
    this.position += 4;
    return result;
  }

  /**
   * Reads a 64-bit floating point number.
   * @returns The read float64 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat64(): number {
    if (this.data.byteLength < this.position + 8) {
      this.throwOutOfRangeError(this.position + 8);
    }
    const result = this.data.getFloat64(this.position, true);
    this.position += 8;
    return result;
  }

  /**
   * Sets the current read position in the buffer.
   * @param position - The new position to set
   */
  setPosition(position: number): void {
    if (this.data.byteLength < position) {
      this.throwOutOfRangeError(position);
    }
    this.position = position;
  }

  /**
   * Checks if the current position is at the end of the buffer.
   * @returns True if at the end of the buffer, false otherwise
   */
  isEnd(): boolean {
    return this.position === this.data.byteLength - 1;
  }

  /**
   * Gets the current position in the buffer.
   * @returns The current position
   */
  get currentPosition(): number {
    return this.position;
  }

  /**
   * Gets the total length of the buffer.
   * @returns The buffer length in bytes
   */
  get length(): number {
    return this.data.byteLength;
  }

  /**
   * Throws an error when attempting to read beyond buffer bounds.
   * @param position - The position that caused the error
   * @throws Error with details about the out of range access
   */
  private throwOutOfRangeError(position: number): void {
    throw new Error(
      `Position ${position} is out of range for the data length ${this.data.byteLength}!`
    );
  }
}
