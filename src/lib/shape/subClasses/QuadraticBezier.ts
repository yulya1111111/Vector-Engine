import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class QuadraticBezier extends Shape 
{
    p0: Point2D;
    p1: Point2D;
    p2: Point2D;

    constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number)
    {
        super();
        this.p0 = { x: x0, y: y0 };
        this.p1 = { x: x1, y: y1 };
        this.p2 = { x: x2, y: y2 };
    }

    private getCurvePoints(steps: number = 20): Point2D[] 
    {
        const points: Point2D[] = [];
        for (let i = 0; i <= steps; i++) 
        {
            const t = i / steps;
            const invT = 1 - t;

            const x = invT * invT * this.p0.x + 2 * invT * t * this.p1.x + t * t * this.p2.x;
            const y = invT * invT * this.p0.y + 2 * invT * t * this.p1.y + t * t * this.p2.y;

            points.push({ x, y });
        }
        return points;
    }

    getLocalBounds(): Bounds | null 
    {
        return Bounds.fromPoints([this.p0, this.p1, this.p2]);
    }

    getBounds(): Bounds | null 
    {
        const points = this.getCurvePoints(20);
        const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
        return Bounds.fromPoints(devicePoints);
    }

    drawRaster(r: RasterRenderer): void 
    {
        const points = this.getCurvePoints(40);
        const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) {
            r.strokePolygon(devicePoints, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const localP = this.transformPointToLocal(px, py);
        if (!localP) return false;
        
        const points = this.getCurvePoints(50);
        const threshold = this.strokeWidth / 2 + 2;

        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToSegmentDistance(localP.x, localP.y, points[i].x, points[i].y, points[i+1].x, points[i+1].y);
            if (dist <= threshold) {
                return true;
            }
        }
        return false;
    }

    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            const ddx = px - x1;
            const ddy = py - y1;
            return Math.sqrt(ddx * ddx + ddy * ddy);
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        const ddx = px - projX;
        const ddy = py - projY;
        return Math.sqrt(ddx * ddx + ddy * ddy);
    }

    toJSON(): any {
        return {
            type: 'QuadraticBezier',
            p0: this.p0,
            p1: this.p1,
            p2: this.p2,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }
}