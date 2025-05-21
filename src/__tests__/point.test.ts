import { Point } from '../point';

describe('Point', () => {
  describe('constructor', () => {
    it('should create a point with default values', () => {
      const point = new Point();
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    it('should create a point with specified values', () => {
      const point = new Point(3, 4);
      expect(point.x).toBe(3);
      expect(point.y).toBe(4);
    });
  });

  describe('set', () => {
    it('should set new coordinates', () => {
      const point = new Point();
      point.set(3, 4);
      expect(point.x).toBe(3);
      expect(point.y).toBe(4);
    });

    it('should return the point instance', () => {
      const point = new Point();
      const result = point.set(3, 4);
      expect(result).toBe(point);
    });
  });

  describe('length', () => {
    it('should calculate correct length', () => {
      const point = new Point(3, 4);
      expect(point.length()).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for origin point', () => {
      const point = new Point();
      expect(point.length()).toBe(0);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const point = new Point(3, 4);
      point.normalize();
      expect(point.x).toBeCloseTo(0.6);
      expect(point.y).toBeCloseTo(0.8);
      expect(point.length()).toBeCloseTo(1);
    });

    it('should handle zero vector', () => {
      const point = new Point();
      point.normalize();
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const point = new Point(3, 4);
      const clone = point.clone();
      expect(clone).not.toBe(point);
      expect(clone.x).toBe(point.x);
      expect(clone.y).toBe(point.y);
    });
  });

  describe('add', () => {
    it('should add coordinates correctly', () => {
      const point1 = new Point(1, 2);
      const point2 = new Point(3, 4);
      point1.add(point2);
      expect(point1.x).toBe(4);
      expect(point1.y).toBe(6);
    });
  });

  describe('subtract', () => {
    it('should subtract coordinates correctly', () => {
      const point1 = new Point(3, 4);
      const point2 = new Point(1, 2);
      point1.subtract(point2);
      expect(point1.x).toBe(2);
      expect(point1.y).toBe(2);
    });
  });

  describe('multiply', () => {
    it('should multiply by scalar correctly', () => {
      const point = new Point(2, 3);
      point.multiply(2);
      expect(point.x).toBe(4);
      expect(point.y).toBe(6);
    });
  });

  describe('divide', () => {
    it('should divide by scalar correctly', () => {
      const point = new Point(4, 6);
      point.divide(2);
      expect(point.x).toBe(2);
      expect(point.y).toBe(3);
    });

    it('should handle division by zero', () => {
      const point = new Point(4, 6);
      point.divide(0);
      expect(point.x).toBe(4);
      expect(point.y).toBe(6);
    });
  });

  describe('multiplyScalars', () => {
    it('should multiply coordinates by different scalars correctly', () => {
      const point = new Point(2, 3);
      point.multiplyScalars(2, 3);
      expect(point.x).toBe(4);
      expect(point.y).toBe(9);
    });

    it('should return the point instance', () => {
      const point = new Point(2, 3);
      const result = point.multiplyScalars(2, 3);
      expect(result).toBe(point);
    });
  });

  describe('divideScalars', () => {
    it('should divide coordinates by different scalars correctly', () => {
      const point = new Point(10, 15);
      point.divideScalars(2, 3);
      expect(point.x).toBe(5);
      expect(point.y).toBe(5);
    });

    it('should handle division by zero for individual coordinates', () => {
      const point = new Point(10, 15);
      point.divideScalars(0, 3);
      expect(point.x).toBe(10); // x remains unchanged due to division by zero
      expect(point.y).toBe(5); // y is divided by 3
    });

    it('should return the point instance', () => {
      const point = new Point(10, 15);
      const result = point.divideScalars(2, 3);
      expect(result).toBe(point);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance correctly', () => {
      const point1 = new Point(0, 0);
      const point2 = new Point(3, 4);
      expect(point1.distanceTo(point2)).toBe(5);
    });

    it('should return 0 for same point', () => {
      const point1 = new Point(3, 4);
      const point2 = new Point(3, 4);
      expect(point1.distanceTo(point2)).toBe(0);
    });
  });
});
