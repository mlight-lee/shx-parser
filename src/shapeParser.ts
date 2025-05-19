import { Point } from './point';
import { ShxByteEncoder } from './byteEncoder';
import { ShxFontData, ShxFontType } from './fontData';
import { Arc } from './arc';

const CIRCLE_SPAN = Math.PI / 18;
const DEFAULT_FONT_SIZE = 12;

/**
 * Represents a shape defined by a collection of polylines and an optional last point.
 * Used to describe the geometry of a character in the SHX font.
 */
export interface ShxShape {
  /** The last point in the shape's geometry, if any */
  readonly lastPoint?: Point;
  /** Array of polylines, where each polyline is an array of points */
  readonly polylines: Point[][];
}

/**
 * Parses SHX font data into shapes on demand. To improve performance, the shape is parsed on demand by
 * character code and font size. Parsed shapes are cached.
 */
export class ShxShapeParser {
  /** Font data of the font file */
  private readonly fontData: ShxFontData;
  /** Cached shapes for performance. Key is `${code}_${size}` */
  private shapeCache: Map<string, ShxShape> = new Map();
  /** Shapes data. Key is the char code */
  private shapeData: Map<number, ShxShape> = new Map();

  constructor(fontData: ShxFontData) {
    this.fontData = fontData;
  }

  /**
   * Releases parsed shapes and cached shapes
   */
  release(): void {
    this.shapeCache.clear();
    this.shapeData.clear();
  }

  /**
   * Parses a character's shape
   * @param code - The character code
   * @param size - The font size
   * @returns The parsed shape or undefined if the character is not found
   */
  parse(code: number, size: number): ShxShape | undefined {
    const key = `${code}_${size}`;
    if (this.shapeCache.has(key)) {
      return this.shapeCache.get(key);
    }
    if (code === 0) {
      return undefined;
    }
    const codes = this.fontData.content.data;
    let textShape;
    if (!this.shapeData.has(code)) {
      if (codes[code]) {
        const data = codes[code];
        const scale = DEFAULT_FONT_SIZE / this.fontData.content.baseUp;
        textShape = this.parseShape(data, scale);

        this.shapeData.set(code, textShape);
      }
    }
    if (this.shapeData.has(code)) {
      const scale = size / DEFAULT_FONT_SIZE;
      const shape = this.shapeData.get(code) as ShxShape;
      textShape = {
        lastPoint: shape.lastPoint?.clone().multiply(scale),
        polylines: shape.polylines.map(line => line.map(point => point.clone().multiply(scale))),
      };
    }
    return textShape;
  }

  /**
   * Parses the shape of a character.
   * Please refer to special codes reference in the following link for more information:
   * https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-06832147-16BE-4A66-A6D0-3ADF98DC8228
   * @param data - The data of the character
   * @param scale - The scale of the font
   * @returns The parsed shape
   */
  private parseShape(data: Uint8Array, scale: number): ShxShape {
    const encoder = new ShxByteEncoder(data.buffer);
    let currentPoint = new Point();
    const polylines: Point[][] = [];
    let currentPolyline: Point[] = [];
    const sp = [];
    let isPenDown = false;

    for (let i = 0; i < data.length; i++) {
      const cb = data[i];
      switch (cb) {
        // End of shape definition
        case 0:
          // Reset state when shape ends
          currentPoint = new Point();
          currentPolyline = [];
          isPenDown = false;
          break;
        // Activate Draw mode (pen down)
        case 1:
          isPenDown = true;
          currentPolyline.push(currentPoint.clone());
          break;
        // Deactivate Draw mode (pen up)
        case 2:
          isPenDown = false;
          if (currentPolyline.length > 1) {
            polylines.push(currentPolyline.slice());
          }
          currentPolyline = [];
          break;
        // Divide vector lengths by next byte
        case 3:
          i++;
          scale /= data[i];
          break;
        // Multiply vector lengths by next byte
        case 4:
          i++;
          scale *= data[i];
          break;
        // Push current location onto stack
        case 5:
          if (sp.length === 4) {
            throw new Error('The position stack is only four locations deep');
          }
          sp.push(currentPoint.clone());
          break;
        // Pop current location from stack
        case 6:
          currentPoint = sp.pop() as Point;
          break;
        // Draw subshape number given by next byte
        case 7:
          {
            let subCode = 0;
            let shape;
            let size = scale * this.fontData.content.baseUp;
            const origin = currentPoint.clone();
            if (currentPolyline.length > 1) {
              polylines.push(currentPolyline.slice());
              currentPolyline = [];
            }
            switch (this.fontData.header.fontType) {
              case ShxFontType.SHAPES:
                i++;
                subCode = data[i];
                break;
              case ShxFontType.BIGFONT:
                i++;
                subCode = data[i];
                if (subCode === 0) {
                  i++;
                  subCode = encoder.toUint16(i);
                  i += 2;
                  origin.x = data[i++] * scale;
                  origin.y = data[i++] * scale;
                  // const width = data[i++] * scale;
                  const height = data[i] * scale;
                  size = height;
                }
                break;
              case ShxFontType.UNIFONT:
                i += 2;
                subCode = encoder.toUint16(i - 1);
                break;
              default:
                break;
            }
            if (subCode !== 0) {
              shape = this.getShapeByCodeWithOffset(subCode, size, origin);
              if (shape) {
                polylines.push(...shape.polylines.slice());
                // Set currentPoint to the subshape's lastPoint (with offset) if it exists, or to (0,0)
                if (shape.lastPoint) {
                  currentPoint = shape.lastPoint.clone();
                } else {
                  currentPoint = new Point();
                }
              }
            }
            // When the subshape is complete, reset the state
            currentPolyline = [];
            isPenDown = false;
          }
          break;
        // X-Y displacement given by next two bytes
        case 8:
          {
            const vec = new Point();
            vec.x = ShxByteEncoder.byteToSByte(data[++i]);
            vec.y = ShxByteEncoder.byteToSByte(data[++i]);
            currentPoint.add(vec.multiply(scale));
            if (isPenDown) {
              currentPolyline.push(currentPoint.clone());
            }
          }
          break;
        // Multiple X-Y displacements, terminated (0,0)
        case 9:
          {
            const tmp = true;
            while (tmp) {
              const vec = new Point();
              vec.x = ShxByteEncoder.byteToSByte(data[++i]);
              vec.y = ShxByteEncoder.byteToSByte(data[++i]);
              if (vec.x === 0 && vec.y === 0) {
                break;
              }
              currentPoint.add(vec.multiply(scale));
              if (isPenDown) {
                currentPolyline.push(currentPoint.clone());
              }
            }
          }
          break;
        // Octant arc defined by next two bytes
        case 10: // 0x0a
          {
            const radius = data[++i] * scale;
            const flag = ShxByteEncoder.byteToSByte(data[++i]);
            const startOctant = (flag & 0x70) >> 4;
            let octantCount = flag & 0x07;
            const isClockwise = flag < 0;
            const startRadian = (Math.PI / 4) * startOctant
            const center = currentPoint
              .clone()
              .subtract(
                new Point(
                  Math.cos(startRadian) * radius,
                  Math.sin(startRadian) * radius
                )
              )

            const arc = Arc.fromOctant(
              center,
              radius,
              startOctant,
              octantCount,
              isClockwise
            );

            if (isPenDown) {
              const arcPoints = arc.tessellate();
              // Remove the last point from the current polyline. 
              // It look like that the current point should not be included for octant arc.
              currentPolyline.pop();
              currentPolyline.push(...arcPoints.slice());
            }
            // Update current point to the end of the arc
            currentPoint = arc.tessellate().pop()?.clone() as Point;
          }
          break;
        // Fractional arc defined by next five bytes
        case 11: //0x0b
          {
            const startOffset = data[++i];
            const endOffset = data[++i];
            const hr = data[++i];
            const lr = data[++i];
            const r = (hr * 255 + lr) * scale;
            const flag = ShxByteEncoder.byteToSByte(data[++i]);
            const n1 = (flag & 0x70) >> 4;
            let n2 = flag & 0x07;
            if (n2 === 0) {
              n2 = 8;
            }
            if (endOffset !== 0) {
              n2--;
            }
            const pi_4 = Math.PI / 4;
            let span = pi_4 * n2;
            let delta = CIRCLE_SPAN;
            let sign = 1;
            if (flag < 0) {
              delta = -delta;
              span = -span;
              sign = -1;
            }
            let startRadian = pi_4 * n1;
            let endRadian = startRadian + span;
            startRadian += ((pi_4 * startOffset) / 256) * sign;
            endRadian += ((pi_4 * endOffset) / 256) * sign;
            const center = currentPoint
              .clone()
              .subtract(new Point(r * Math.cos(startRadian), r * Math.sin(startRadian)));
            currentPoint = center
              .clone()
              .add(new Point(r * Math.cos(endRadian), r * Math.sin(endRadian)));
            if (isPenDown) {
              let currentRadian = startRadian;
              const tmp = true;
              while (tmp) {
                currentRadian += delta;
                if (
                  (flag > 0 && currentRadian < endRadian) ||
                  (flag < 0 && currentRadian > endRadian)
                ) {
                  currentPolyline.push(
                    center
                      .clone()
                      .add(new Point(r * Math.cos(currentRadian), r * Math.sin(currentRadian)))
                  );
                } else {
                  break;
                }
              }
              currentPolyline.push(currentPoint.clone());
            }
          }
          break;
        // Arc defined by X-Y displacement and bulge
        case 12: // 0x0c
          {
            const vec = new Point();
            vec.x = ShxByteEncoder.byteToSByte(data[++i]);
            vec.y = ShxByteEncoder.byteToSByte(data[++i]);
            const bulge = ShxByteEncoder.byteToSByte(data[++i]);
            currentPoint = this.handleArcSegment(
              currentPoint,
              vec,
              bulge,
              scale,
              isPenDown,
              currentPolyline
            );
          }
          break;
        // Multiple bulge-specified arcs
        case 13: // 0x0d
          {
            const tmp = true;
            while (tmp) {
              const vec = new Point();
              vec.x = ShxByteEncoder.byteToSByte(data[++i]);
              vec.y = ShxByteEncoder.byteToSByte(data[++i]);
              if (vec.x === 0 && vec.y === 0) {
                break;
              }
              const bulge = ShxByteEncoder.byteToSByte(data[++i]);
              currentPoint = this.handleArcSegment(
                currentPoint,
                vec,
                bulge,
                scale,
                isPenDown,
                currentPolyline
              );
            }
          }
          break;
        // Process next command only if vertical text
        case 14: //0x0e
          i = this.skipCode(data, ++i);
          break;
        default:
          if (cb > 0x0f) {
            const len = (cb & 0xf0) >> 4;
            const dir = cb & 0x0f;
            const vec = new Point();
            switch (dir) {
              case 0:
                vec.x = 1;
                break;
              case 1:
                vec.x = 1;
                vec.y = 0.5;
                break;
              case 2:
                vec.x = 1;
                vec.y = 1;
                break;
              case 3:
                vec.x = 0.5;
                vec.y = 1;
                break;
              case 4:
                vec.y = 1;
                break;
              case 5:
                vec.x = -0.5;
                vec.y = 1;
                break;
              case 6:
                vec.x = -1;
                vec.y = 1;
                break;
              case 7:
                vec.x = -1;
                vec.y = 0.5;
                break;
              case 8:
                vec.x = -1;
                break;
              case 9:
                vec.x = -1;
                vec.y = -0.5;
                break;
              case 10:
                vec.x = -1;
                vec.y = -1;
                break;
              case 11:
                vec.x = -0.5;
                vec.y = -1;
                break;
              case 12:
                vec.y = -1;
                break;
              case 13:
                vec.x = 0.5;
                vec.y = -1;
                break;
              case 14:
                vec.x = 1;
                vec.y = -1;
                break;
              case 15:
                vec.x = 1;
                vec.y = -0.5;
                break;
            }
            currentPoint.add(vec.multiply(len * scale));
            if (isPenDown) {
              currentPolyline.push(currentPoint.clone());
            }
          }
          break;
      }
    }
    return {
      lastPoint: currentPoint,
      polylines,
    };
  }

  private skipCode(data: Uint8Array, index: number) {
    const cb = data[index];
    switch (cb) {
      case 0x00:
        break;
      case 0x01:
        break;
      case 0x02:
        break;
      case 0x03:
      case 0x04:
        index++;
        break;
      case 0x05:
        break;
      case 0x06:
        break;
      case 0x07:
        switch (this.fontData.header.fontType) {
          case ShxFontType.SHAPES:
            index++;
            break;
          case ShxFontType.BIGFONT:
            {
              index++;
              const subCode = data[index];
              if (subCode === 0) {
                index += 6;
              }
            }
            break;
          case ShxFontType.UNIFONT:
            index += 2;
            break;
        }
        break;
      case 0x08:
        index += 2;
        break;
      case 0x09:
        {
          const tmp = true;
          while (tmp) {
            const x = data[++index];
            const y = data[++index];
            if (x === 0 && y === 0) {
              break;
            }
          }
        }
        break;
      case 0x0a:
        index += 2;
        break;
      case 0x0b:
        index += 5;
        break;
      case 0x0c:
        index += 3;
        break;
      case 0x0d:
        {
          const tmp = true;
          while (tmp) {
            const x = data[++index];
            const y = data[++index];
            if (x === 0 && y === 0) {
              break;
            }
            data[++index];
          }
        }
        break;
      case 0x0e:
        break;
      default:
        break;
    }
    return index;
  }

  private getShapeByCodeWithOffset(
    code: number,
    size: number,
    translate: Point
  ): ShxShape | undefined {
    const shape = this.parse(code, size);
    if (shape) {
      return {
        lastPoint: shape.lastPoint?.clone().add(translate),
        polylines: shape.polylines.map(line => line.map(point => point.clone().add(translate))),
      };
    }
    return undefined;
  }

  /**
   * Handles drawing an arc segment with the given vector and bulge
   * @param currentPoint The starting point of the arc
   * @param vec The displacement vector
   * @param bulge The bulge value (will be normalized by 127.0)
   * @param scale The current scale factor
   * @param isPenDown Whether the pen is currently down (drawing)
   * @param currentPolyline The current polyline being built
   * @returns The new current point after the arc
   */
  private handleArcSegment(
    currentPoint: Point,
    vec: Point,
    bulge: number,
    scale: number,
    isPenDown: boolean,
    currentPolyline: Point[]
  ): Point {
    // Apply scale to vector
    vec.x *= scale;
    vec.y *= scale;

    // Clamp bulge value
    if (bulge < -127) {
      bulge = -127;
    }

    // Update current point position
    const newPoint = currentPoint.clone();
    if (isPenDown) {
      if (bulge === 0) {
        currentPolyline.push(newPoint.clone().add(vec));
      } else {
        // Create arc and get tessellated points
        const end = newPoint.clone().add(vec);
        const arc = Arc.fromBulge(newPoint, end, bulge / 127.0);
        const arcPoints = arc.tessellate();
        // Add all points except the first one (since currentPoint is already in the polyline)
        currentPolyline.push(...arcPoints.slice(1));
      }
    }
    newPoint.add(vec);
    return newPoint;
  }
}
