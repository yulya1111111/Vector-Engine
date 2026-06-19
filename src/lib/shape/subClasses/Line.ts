﻿import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class Line extends Shape 
{
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(x1: number, y1: number, x2: number, y2: number) 
    {
        super();
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        // Центрируем линию относительно её середины
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;

        this.transform.x = cx;
        this.transform.y = cy;

        // Пересчитываем координаты относительно центра
        this.x1 -= cx;
        this.y1 -= cy;
        this.x2 -= cx;
        this.y2 -= cy;
    }

    getLocalBounds(): Bounds | null {
        const minX = Math.min(this.x1, this.x2);
        const maxX = Math.max(this.x1, this.x2);
        const minY = Math.min(this.y1, this.y2);
        const maxY = Math.max(this.y1, this.y2);
        return new Bounds(minX, minY, maxX, maxY);
    }

    getBounds(): Bounds | null {
        const p1 = this.transformPointToDevice(this.x1, this.y1);
        const p2 = this.transformPointToDevice(this.x2, this.y2);
        return Bounds.fromPoints([p1, p2]);
    }

    drawRaster(r: RasterRenderer): void {
        const p1 = this.transformPointToDevice(this.x1, this.y1);
        const p2 = this.transformPointToDevice(this.x2, this.y2);

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) {
            r.strokeLine(p1.x, p1.y, p2.x, p2.y, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const localPoint = this.transformPointToLocal(px, py);
        if (!localPoint) return false;

        // Расстояние от точки до отрезка
        const dist = this.pointToSegmentDistance(localPoint.x, localPoint.y, this.x1, this.y1, this.x2, this.y2);
        return dist <= this.strokeWidth / 2;
    }

    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number 
    {
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

    // Control points for Line (start and end points)
    getControlPoints(): Point2D[] {
        return [{ x: this.x1, y: this.y1 }, { x: this.x2, y: this.y2 }];
    }

    setControlPoint(idx: number, pt: Point2D): void {
        switch (idx) {
            case 0: 
                // Move start point, adjust end point to maintain center
                const dx = pt.x - this.x1;
                const dy = pt.y - this.y1;
                this.x1 = pt.x;
                this.y1 = pt.y;
                this.x2 += dx;
                this.y2 += dy;
                break;
            case 1:
                // Move end point, adjust start point to maintain center
                const dx2 = pt.x - this.x2;
                const dy2 = pt.y - this.y2;
                this.x2 = pt.x;
                this.y2 = pt.y;
                this.x1 += dx2;
                this.y1 += dy2;
                break;
            default: throw new Error(`Invalid control point index: ${idx}`);
        }
    }

    toJSON(): any 
    {
        return {
            type: 'Line',
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }
}