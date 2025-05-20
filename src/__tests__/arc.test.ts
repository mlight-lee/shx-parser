import { Arc } from '../arc';
import { Point } from '../point';

describe('Arc', () => {
  describe('fromBulge', () => {
    it('should create arc with correct radius and direction (positive bulge - semicircle)', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = 1; // Semicircle (180 degrees counterclockwise)

      const arc = Arc.fromBulge(start, end, bulge);

      // For bulge = 1 (semicircle), radius equals half the chord length
      expect(arc.radius).toBeCloseTo(50);
      expect(arc.isClockwise).toBe(false);
    });

    it('should create arc with correct radius and direction (negative bulge - semicircle)', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = -1; // Semicircle (180 degrees clockwise)

      const arc = Arc.fromBulge(start, end, bulge);

      expect(arc.radius).toBeCloseTo(50);
      expect(arc.isClockwise).toBe(true);
    });

    it('should handle bulge value of 0.5 correctly', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      // Approximately 106.27 degrees counterclockwise
      // angle = 4 * arctan(0.5) ≈ 106.27 degrees
      const bulge = 0.5;

      const arc = Arc.fromBulge(start, end, bulge);

      // For bulge = 0.5, radius can be calculated using the formula:
      // radius = chord_length * (1 + bulge^2) / (4 * bulge)
      // where chord_length = 100 in this case
      expect(arc.radius).toBeCloseTo(62.5);
      expect(arc.isClockwise).toBe(false);
    });

    it('should handle quarter circle (90 degrees) with bulge value tan(π/8)', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      // Exactly 90 degrees counterclockwise ≈ 0.414214
      const bulge = Math.tan(Math.PI / 8);

      const arc = Arc.fromBulge(start, end, bulge);

      // For a 90-degree arc, radius can be calculated using the formula:
      // radius = chord_length * (1 + bulge^2) / (4 * bulge)
      // For a quarter circle, this equals chord_length / (2 * sin(π/4))
      expect(arc.radius).toBeCloseTo(70.71); // 100 / (2 * sin(π/4)) ≈ 70.71
      expect(arc.isClockwise).toBe(false);
    });

    it('should handle straight line (bulge = 0)', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = 0; // Straight line

      const arc = Arc.fromBulge(start, end, bulge);

      expect(arc.radius).toBe(0);

      // Check tessellated points - should only have start and end points
      const points = arc.tessellate();
      expect(points.length).toBe(2);
      expect(points[0].x).toBe(0);
      expect(points[0].y).toBe(0);
      expect(points[1].x).toBe(100);
      expect(points[1].y).toBe(0);
    });

    it('should clamp bulge values to [-1, 1]', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = 2; // Should be clamped to 1

      const arc = Arc.fromBulge(start, end, bulge);

      // Should create a semicircle (same as bulge = 1)
      expect(arc.radius).toBeCloseTo(50);
      expect(arc.isClockwise).toBe(false);
    });
  });

  describe('fromOctant', () => {
    it('should create arc with specified radius and direction (counterclockwise)', () => {
      const center = new Point(0, 0);
      const radius = 5;
      const startOctant = 0;
      const octantCount = 2;
      const isClockwise = false;

      const arc = Arc.fromOctant(center, radius, startOctant, octantCount, isClockwise);

      expect(arc.radius).toBe(radius);
      expect(arc.isClockwise).toBe(isClockwise);
      expect(arc.center.x).toBe(center.x);
      expect(arc.center.y).toBe(center.y);
      expect(arc.startAngle).toBeCloseTo(0); // 0 degrees
      expect(arc.endAngle).toBeCloseTo(Math.PI / 2); // 90 degrees
      
      // Check start point (0 degrees)
      expect(arc.start.x).toBeCloseTo(radius);
      expect(arc.start.y).toBeCloseTo(0);
      
      // Check end point (90 degrees)
      expect(arc.end.x).toBeCloseTo(0);
      expect(arc.end.y).toBeCloseTo(radius);
    });

    it('should create arc with specified radius and direction (clockwise)', () => {
      const center = new Point(0, 0);
      const radius = 3;
      const startOctant = 2;
      const octantCount = 3;
      const isClockwise = true;

      const arc = Arc.fromOctant(center, radius, startOctant, octantCount, isClockwise);

      expect(arc.radius).toBe(radius);
      expect(arc.isClockwise).toBe(isClockwise);
      expect(arc.center.x).toBe(center.x);
      expect(arc.center.y).toBe(center.y);
      expect(arc.startAngle).toBeCloseTo(Math.PI / 2); // 90 degrees
      expect(arc.endAngle).toBeCloseTo(-Math.PI / 4); // -45 degrees
      
      // Check start point (90 degrees)
      expect(arc.start.x).toBeCloseTo(0);
      expect(arc.start.y).toBeCloseTo(radius);
      
      // Check end point (-45 degrees)
      expect(arc.end.x).toBeCloseTo(radius * Math.cos(-Math.PI / 4));
      expect(arc.end.y).toBeCloseTo(radius * Math.sin(-Math.PI / 4));
    });

    it('should handle full circle (octantCount = 0)', () => {
      const center = new Point(1, 1);
      const radius = 2;
      const startOctant = 4;
      const octantCount = 0; // Full circle
      const isClockwise = false;

      const arc = Arc.fromOctant(center, radius, startOctant, octantCount, isClockwise);

      expect(arc.radius).toBe(radius);
      expect(arc.isClockwise).toBe(isClockwise);
      expect(arc.center.x).toBe(center.x);
      expect(arc.center.y).toBe(center.y);
      expect(arc.startAngle).toBeCloseTo(Math.PI); // 180 degrees
      // For full circle, end angle should be start angle + 2π
      expect(arc.endAngle).toBeCloseTo(Math.PI + 2 * Math.PI); // 180 degrees + 360 degrees
      
      // Check start point (180 degrees)
      expect(arc.start.x).toBeCloseTo(center.x - radius);
      expect(arc.start.y).toBeCloseTo(center.y);
      
      // Check end point (180 degrees - full circle)
      expect(arc.end.x).toBeCloseTo(center.x - radius);
      expect(arc.end.y).toBeCloseTo(center.y);
    });

    it('should handle arc spanning multiple octants', () => {
      const center = new Point(0, 0);
      const radius = 4;
      const startOctant = 1;
      const octantCount = 5;
      const isClockwise = false;

      const arc = Arc.fromOctant(center, radius, startOctant, octantCount, isClockwise);

      expect(arc.radius).toBe(radius);
      expect(arc.isClockwise).toBe(isClockwise);
      expect(arc.center.x).toBe(center.x);
      expect(arc.center.y).toBe(center.y);
      expect(arc.startAngle).toBeCloseTo(Math.PI / 4); // 45 degrees
      expect(arc.endAngle).toBeCloseTo(3 * Math.PI / 2); // 270 degrees
      
      // Check start point (45 degrees)
      expect(arc.start.x).toBeCloseTo(radius * Math.cos(Math.PI / 4));
      expect(arc.start.y).toBeCloseTo(radius * Math.sin(Math.PI / 4));
      
      // Check end point (270 degrees)
      expect(arc.end.x).toBeCloseTo(0);
      expect(arc.end.y).toBeCloseTo(-radius);
    });
  });

  describe('tessellate', () => {
    const testCircleSpan = Math.PI / 16; // Using this specific span for more predictable points

    it('should tessellate semicircle (bulge = 1) correctly', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = 1; // Semicircle (180 degrees counterclockwise)

      const arc = Arc.fromBulge(start, end, bulge);
      const points = arc.tessellate(testCircleSpan);

      // Should have start point, end point, and intermediate points
      // For 180 degrees with PI/16 span, expect around 17 points (180/(180/16) + 1)
      expect(points.length).toBe(17);

      // Check start and end points
      expect(points[0].x).toBeCloseTo(0);
      expect(points[0].y).toBeCloseTo(0);
      expect(points[points.length - 1].x).toBeCloseTo(100);
      expect(points[points.length - 1].y).toBeCloseTo(0);

      // Check highest point (should be at 90 degrees)
      const midIndex = 8; // At PI/2 (90 degrees), which is 8 steps of PI/16
      expect(points[midIndex].x).toBeCloseTo(50);
      expect(points[midIndex].y).toBeCloseTo(-50);

      // Check 45-degree point (PI/4)
      const quarterIndex = 4; // At PI/4 (45 degrees), which is 4 steps of PI/16
      const expectedDist = 50 * Math.sqrt(2); // Distance from center to point at 45 degrees
      expect(points[quarterIndex].x).toBeCloseTo(50 - expectedDist / 2);
      expect(points[quarterIndex].y).toBeCloseTo(-expectedDist / 2);
    });

    it('should tessellate clockwise semicircle (bulge = -1) correctly', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = -1; // Semicircle (180 degrees clockwise)

      const arc = Arc.fromBulge(start, end, bulge);
      const points = arc.tessellate(testCircleSpan);

      // Should have same number of points as counterclockwise semicircle
      expect(points.length).toBe(17);

      // Check lowest point (should be at 270 degrees)
      const midIndex = 8; // At 3PI/2 (270 degrees)
      expect(points[midIndex].x).toBeCloseTo(50);
      expect(points[midIndex].y).toBeCloseTo(50);

      // Check 315-degree point (7PI/4)
      const quarterIndex = 4;
      const expectedDist = 50 * Math.sqrt(2);
      expect(points[quarterIndex].x).toBeCloseTo(50 - expectedDist / 2);
      expect(points[quarterIndex].y).toBeCloseTo(expectedDist / 2);
    });

    it('should tessellate quarter circle (bulge = 0.5) correctly', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      // Exactly 90 degrees counterclockwise ≈ 0.414214
      const bulge = Math.tan(Math.PI / 8);

      const arc = Arc.fromBulge(start, end, bulge);
      const points = arc.tessellate(testCircleSpan);

      // For 90 degrees with PI/16 span, expect around 9 points (90/(180/16) + 1)
      expect(points.length).toBe(9);

      // Check highest point
      const midIndex = 4; // At PI/4 (45 degrees), which is 4 steps of PI/16
      const radius = arc.radius;
      expect(points[midIndex].x).toBeCloseTo(50);
      expect(points[midIndex].y).toBeCloseTo(-radius + Math.sqrt(radius * radius - 50 * 50));
    });

    it('should tessellate octant arc correctly with custom span', () => {
      const center = new Point(0, 0);
      const radius = 100;
      const startOctant = 0;
      const octantCount = 2; // 90 degrees
      const isClockwise = false;

      const arc = Arc.fromOctant(center, radius, startOctant, octantCount, isClockwise);
      const points = arc.tessellate(testCircleSpan);

      // For 90 degrees with PI/16 span, expect around 9 points (90/(180/16) + 1)
      expect(points.length).toBe(9);

      // Check start point (0 degrees)
      expect(points[0].x).toBeCloseTo(100);
      expect(points[0].y).toBeCloseTo(0);

      // Check 45-degree point
      const midIndex = 4;
      expect(points[midIndex].x).toBeCloseTo(100 * Math.cos(Math.PI / 4));
      expect(points[midIndex].y).toBeCloseTo(100 * Math.sin(Math.PI / 4));

      // Check end point (90 degrees)
      expect(points[points.length - 1].x).toBeCloseTo(0);
      expect(points[points.length - 1].y).toBeCloseTo(100);
    });

    it('should handle straight line with custom span', () => {
      const start = new Point(0, 0);
      const end = new Point(100, 0);
      const bulge = 0;

      const arc = Arc.fromBulge(start, end, bulge);
      const points = arc.tessellate(testCircleSpan);

      // Straight line should always have exactly 2 points
      expect(points.length).toBe(2);
      expect(points[0].x).toBe(0);
      expect(points[0].y).toBe(0);
      expect(points[1].x).toBe(100);
      expect(points[1].y).toBe(0);
    });
  });
});
