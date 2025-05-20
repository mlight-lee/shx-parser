import { Point } from './point';

const OCTANT_ANGLE = Math.PI / 4; // 45 degrees

/**
 * Represents a circular arc defined by either:
 * 1. Start point, end point, and bulge factor
 * 2. Center point, radius, start octant, and number of octants to span
 *
 * For bulge arcs:
 * - bulge = (2 * H / D) where H is height from midpoint and D is chord length
 * - bulge = 1 represents a semicircle (180 degrees)
 * - bulge = 0 represents a straight line
 * - |bulge| should not exceed 1
 */
export class Arc {
  public readonly start: Point;
  public readonly end: Point;
  private readonly bulge: number | undefined;
  public readonly center: Point;
  public readonly radius: number;
  public readonly startAngle: number;
  public readonly endAngle: number;
  public readonly isClockwise: boolean;

  /**
   * Creates a bulge-defined arc
   * @param start Start point
   * @param end End point
   * @param bulge Bulge factor (-1 to 1, where 1 is a semicircle)
   */
  static fromBulge(start: Point, end: Point, bulge: number): Arc {
    // Clamp bulge to valid range
    const clampedBulge = Math.max(-1, Math.min(1, bulge));
    return new Arc({
      start,
      end,
      bulge: clampedBulge,
    });
  }

  /**
   * Creates an octant-defined arc
   * @param center Center point of the arc
   * @param radius Radius of the arc
   * @param startOctant Starting octant (0-7)
   * @param octantCount Number of octants to span (0-8, where 0 means 8 octants)
   * @param isClockwise Whether the arc goes clockwise
   */
  static fromOctant(
    center: Point,
    radius: number,
    startOctant: number,
    octantCount: number,
    isClockwise: boolean
  ): Arc {
    return new Arc({
      center,
      radius,
      startOctant,
      octantCount,
      isClockwise,
    });
  }

  private constructor(params: {
    start?: Point;
    end?: Point;
    bulge?: number;
    center?: Point;
    radius?: number;
    startOctant?: number;
    octantCount?: number;
    isClockwise?: boolean;
  }) {
    if (params.start && params.end && params.bulge !== undefined) {
      // Bulge arc initialization
      this.start = params.start.clone();
      this.end = params.end.clone();
      this.bulge = params.bulge;
      this.isClockwise = params.bulge < 0;

      // Calculate arc geometry
      const distance = this.end.clone().subtract(this.start);
      const D = distance.length(); // Total chord length
      const H = (Math.abs(this.bulge) * D) / 2; // Height from midpoint to arc (bulge = 2H/D)

      if (H === 0) {
        // Handle straight line case
        this.radius = 0;
        this.center = this.start.clone();
        this.startAngle = Math.atan2(distance.y, distance.x);
        this.endAngle = this.startAngle;
        return;
      }

      // For an arc segment:
      // - theta is the included angle
      // - bulge = tan(theta/4)
      const theta = 4 * Math.atan(Math.abs(this.bulge));
      this.radius = D / (2 * Math.sin(theta / 2));

      // Calculate center point
      const midpoint = this.start.clone().add(distance.clone().divide(2));
      const normal = new Point(-distance.y, distance.x); // Perpendicular to chord
      normal.normalize();
      normal.multiply(Math.abs(this.radius * Math.cos(theta / 2))); // Distance from midpoint to center

      this.center = midpoint.clone();
      if (this.isClockwise) {
        this.center.subtract(normal);
      } else {
        this.center.add(normal);
      }

      // Calculate start and end angles
      this.startAngle = Math.atan2(this.start.y - this.center.y, this.start.x - this.center.x);
      this.endAngle = Math.atan2(this.end.y - this.center.y, this.end.x - this.center.x);

      // Ensure proper angle range for the arc direction
      if (this.isClockwise) {
        if (this.endAngle >= this.startAngle) {
          this.endAngle -= 2 * Math.PI;
        }
      } else {
        if (this.endAngle <= this.startAngle) {
          this.endAngle += 2 * Math.PI;
        }
      }
    } else if (
      params.center &&
      params.radius !== undefined &&
      params.startOctant !== undefined &&
      params.octantCount !== undefined &&
      params.isClockwise !== undefined
    ) {
      // Octant arc initialization
      this.center = params.center.clone();
      this.radius = params.radius;
      this.isClockwise = params.isClockwise;

      // Convert octant to angle (octants start at 3 o'clock and go counterclockwise)
      this.startAngle = params.startOctant * OCTANT_ANGLE;

      // Handle octantCount (0 means 8 octants)
      const span = (params.octantCount === 0 ? 8 : params.octantCount) * OCTANT_ANGLE;
      this.endAngle = this.startAngle + (this.isClockwise ? -span : span);

      // Calculate start point
      this.start = this.center
        .clone()
        .add(
          new Point(
            this.radius * Math.cos(this.startAngle),
            this.radius * Math.sin(this.startAngle)
          )
        );

      // Calculate end point
      this.end = this.center
        .clone()
        .add(
          new Point(
            this.radius * Math.cos(this.endAngle),
            this.radius * Math.sin(this.endAngle)
          )
        );
    } else {
      throw new Error('Invalid arc parameters');
    }
  }

  /**
   * Tessellates the arc into a series of points that approximate the arc.
   * @param circleSpan The angle span between tessellated points (default Math.PI / 18)
   * @returns Array of points representing the tessellated arc
   */
  tessellate(circleSpan: number = Math.PI / 18): Point[] {
    // Handle straight line case
    if (this.radius === 0) {
      return [this.start.clone(), this.end.clone()];
    }

    const points: Point[] = [this.start.clone()];

    // Calculate the included angle
    const includedAngle = Math.abs(this.endAngle - this.startAngle);

    // Calculate number of segments needed (excluding start and end points)
    const numSegments = Math.max(1, Math.floor(includedAngle / circleSpan));

    // Generate intermediate points
    for (let i = 1; i < numSegments; i++) {
      const t = i / numSegments;
      const angle = this.isClockwise
        ? this.startAngle - t * includedAngle
        : this.startAngle + t * includedAngle;

      points.push(
        this.center
          .clone()
          .add(new Point(this.radius * Math.cos(angle), this.radius * Math.sin(angle)))
      );
    }

    // Add the end point
    points.push(
      this.end
        ? this.end.clone()
        : this.center
            .clone()
            .add(
              new Point(
                this.radius * Math.cos(this.endAngle),
                this.radius * Math.sin(this.endAngle)
              )
            )
    );

    return points;
  }
}
