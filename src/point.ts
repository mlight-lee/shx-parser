/**
 * Represents a 2D point with x and y coordinates.
 */
export class Point {
  /** The x-coordinate of the point */
  x: number;
  /** The y-coordinate of the point */
  y: number;

  /**
   * Creates a new Point instance.
   * @param x - The x-coordinate (defaults to 0)
   * @param y - The y-coordinate (defaults to 0)
   */
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Sets the coordinates of the point.
   * @param x - The new x-coordinate
   * @param y - The new y-coordinate
   * @returns The point instance for method chaining
   */
  set(x: number, y: number): Point {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Calculates the length (magnitude) of the vector from origin to this point.
   * @returns The length of the vector
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalizes the point vector to have a length of 1.
   * @returns The point instance for method chaining
   */
  normalize(): Point {
    const length = this.length();
    if (length !== 0) {
      this.x /= length;
      this.y /= length;
    }
    return this;
  }

  /**
   * Creates a new Point instance with the same coordinates.
   * @returns A new Point instance with the same x and y values
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Adds another point's coordinates to this point.
   * @param point - The point to add
   * @returns The point instance for method chaining
   */
  add(point: Point): Point {
    this.x += point.x;
    this.y += point.y;
    return this;
  }

  /**
   * Subtracts another point's coordinates from this point.
   * @param point - The point to subtract
   * @returns The point instance for method chaining
   */
  subtract(point: Point): Point {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }

  /**
   * Multiplies both coordinates by a scalar value.
   * @param scalar - The scalar value to multiply by
   * @returns The point instance for method chaining
   */
  multiply(scalar: number): Point {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divides both coordinates by a scalar value.
   * @param scalar - The scalar value to divide by
   * @returns The point instance for method chaining
   */
  divide(scalar: number): Point {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  /**
   * Multiplies x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to multiply x-coordinate by
   * @param yScalar - The scalar value to multiply y-coordinate by
   * @returns The point instance for method chaining
   */
  multiplyScalars(xScalar: number, yScalar: number): Point {
    this.x *= xScalar;
    this.y *= yScalar;
    return this;
  }

  /**
   * Divides x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to divide x-coordinate by
   * @param yScalar - The scalar value to divide y-coordinate by
   * @returns The point instance for method chaining
   */
  divideScalars(xScalar: number, yScalar: number): Point {
    if (xScalar !== 0) this.x /= xScalar;
    if (yScalar !== 0) this.y /= yScalar;
    return this;
  }

  /**
   * Calculates the Euclidean distance to another point.
   * @param point - The point to calculate distance to
   * @returns The distance between the two points
   */
  distanceTo(point: Point): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
