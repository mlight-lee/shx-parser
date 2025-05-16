import { ShxByteEncoder, ShxEncodable } from '../byteEncoder';

describe('ShxByteEncoder', () => {
  describe('getBytes', () => {
    it('should encode strings correctly', () => {
      const result = ShxByteEncoder.getBytes('test');
      expect(Array.from(result)).toEqual([116, 101, 115, 116]); // ASCII values for 'test'
    });

    it('should encode integers correctly', () => {
      const value = 12345;
      const result = ShxByteEncoder.getBytes(value);
      expect(result.length).toBe(4); // 32-bit integer
      const decoder = new ShxByteEncoder(result.buffer);
      expect(decoder.toInt32()).toBe(value);
    });

    it('should encode floating point numbers correctly', () => {
      const value = 123.45;
      const result = ShxByteEncoder.getBytes(value);
      expect(result.length).toBe(8); // 64-bit float
      const decoder = new ShxByteEncoder(result.buffer);
      expect(decoder.toFloat64()).toBeCloseTo(value);
    });

    it('should encode booleans correctly', () => {
      expect(Array.from(ShxByteEncoder.getBytes(true))).toEqual([1]);
      expect(Array.from(ShxByteEncoder.getBytes(false))).toEqual([0]);
    });

    it('should encode arrays correctly', () => {
      const result = ShxByteEncoder.getBytes(['test', 123, true]);
      const decoder = new ShxByteEncoder(result.buffer);

      // First 4 bytes are 'test'
      expect(Array.from(result.slice(0, 4))).toEqual([116, 101, 115, 116]);

      // Next 4 bytes are the number 123
      expect(decoder.toInt32(4)).toBe(123);

      // Last byte is boolean true (1)
      expect(result[8]).toBe(1);
    });

    it('should throw error for unsupported types', () => {
      expect(() => ShxByteEncoder.getBytes({} as ShxEncodable)).toThrow('Unsupported type');
    });
  });

  describe('fromUint8Array', () => {
    it('should create encoder from Uint8Array', () => {
      const array = new Uint8Array([1, 2, 3, 4]);
      const encoder = ShxByteEncoder.fromUint8Array(array);
      expect(encoder).toBeInstanceOf(ShxByteEncoder);
    });
  });

  describe('byteToSByte', () => {
    it('should convert unsigned bytes to signed bytes', () => {
      expect(ShxByteEncoder.byteToSByte(127)).toBe(127);
      expect(ShxByteEncoder.byteToSByte(128)).toBe(-128);
      expect(ShxByteEncoder.byteToSByte(255)).toBe(-1);
    });
  });

  describe('data reading methods', () => {
    let encoder: ShxByteEncoder;

    beforeEach(() => {
      const buffer = new ArrayBuffer(24);
      const view = new DataView(buffer);
      view.setInt32(0, 12345, true); // For toInt32
      view.setUint16(4, 12345, true); // For toUint16
      view.setUint32(8, 12345, true); // For toUint32 (moved to offset 8)
      view.setFloat64(16, 123.45, true); // For toFloat64 (moved to offset 16)
      encoder = new ShxByteEncoder(buffer);
    });

    it('should read boolean values', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint8(0, 1);
      view.setUint8(1, 0);
      const boolEncoder = new ShxByteEncoder(buffer);

      expect(boolEncoder.toBoolean(0)).toBe(true);
      expect(boolEncoder.toBoolean(1)).toBe(false);
    });

    it('should read Int32 values', () => {
      expect(encoder.toInt32(0)).toBe(12345);
    });

    it('should read Uint16 values', () => {
      expect(encoder.toUint16(4)).toBe(12345);
    });

    it('should read Uint32 values', () => {
      expect(encoder.toUint32(8)).toBe(12345); // Updated offset to match setup
    });

    it('should read Float64 values', () => {
      expect(encoder.toFloat64(16)).toBeCloseTo(123.45); // Updated offset to match setup
    });
  });
});
