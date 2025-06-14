import { Point } from './point';

/**
 * Represents a shape defined by a collection of polylines and an optional last point.
 * Used to describe the geometry of a character in the SHX font.
 */
export class ShxShape {
  /** The last point in the shape's geometry, if any */
  readonly lastPoint?: Point;
  /** Array of polylines, where each polyline is an array of points */
  readonly polylines: Point[][];

  constructor(lastPoint?: Point, polylines: Point[][] = []) {
    this.lastPoint = lastPoint;
    this.polylines = polylines;
  }

  /**
   * Get the bounding box of the shape
   * @returns Bounding box of the shape
   */
  get bbox(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    // Calculate the bounds of the shape
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    this.polylines.forEach(polyline => {
      polyline.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    return { minX, minY, maxX, maxY };
  }

  /**
   * Offset the shape by a point
   * @param p The point to offset the shape by
   * @param isNewInstance Whether to return a new instance of the shape or modify the current instance
   * @returns The offset shape
   */
  offset(p: Point, isNewInstance = true): ShxShape {
    if (isNewInstance) {
      return new ShxShape(
        this.lastPoint?.clone().add(p),
        this.polylines.map(polyline => polyline.map(point => point.clone().add(p)))
      );
    } else {
      this.lastPoint?.add(p);
      this.polylines.forEach(polyline => polyline.forEach(point => point.add(p)));
      return this;
    }
  }

  /**
   * Converts the shape to an SVG string
   * @param options SVG rendering options
   * @returns SVG string
   */
  toSVG(
    options: {
      strokeWidth?: string;
      strokeColor?: string;
      isAutoFit?: boolean;
    } = {}
  ): string {
    const { strokeWidth = '0.5%', strokeColor = 'black', isAutoFit = false } = options;

    let viewBox: string;
    let paths: string;

    if (isAutoFit) {
      // Calculate bounds with padding
      const bbox = this.bbox;
      const padding = 0.2; // 20% padding
      const width = bbox.maxX - bbox.minX;
      const height = bbox.maxY - bbox.minY;
      const minX = bbox.minX - width * padding;
      const maxX = bbox.maxX + width * padding;
      const minY = bbox.minY - height * padding;
      const maxY = bbox.maxY + height * padding;

      // Create SVG paths with original coordinates
      paths = this.polylines
        .map(polyline => {
          let d = '';
          polyline.forEach((point, index) => {
            const x = point.x;
            const y = -point.y; // Flip Y coordinates for SVG coordinate system
            d += index === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
          });
          return `<path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none"/>`;
        })
        .join('');

      // Set viewBox to match shape bounds
      viewBox = `${minX} ${-maxY} ${maxX - minX} ${maxY - minY}`;
    } else {
      // Use fixed viewBox
      viewBox = '0 0 20 20';
      paths = this.polylines
        .map(polyline => {
          let d = '';
          polyline.forEach((point, index) => {
            const x = point.x + 5;
            const y = -point.y + 15; // Flip Y coordinates for SVG coordinate system
            d += index === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
          });
          return `<path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none"/>`;
        })
        .join('');
    }

    // Return complete SVG string with 100% width and height
    return `<svg width="100%" height="100%" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
  }
}
