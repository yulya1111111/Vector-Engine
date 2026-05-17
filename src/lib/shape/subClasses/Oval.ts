import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class Oval extends Shape {
    rx: number;
    ry: number;

    constructor(rx: number, ry: number)
    {
        super();
        this.rx = rx;
        this.ry = ry;
    }

    getLocalBounds(): Bounds | null {
        return new Bounds(-this.rx, -this.ry, this.rx, this.ry);
    }

    getBounds(): Bounds | null {
        const localBounds = this.getLocalBounds();
        if (!localBounds) return null;

        const points: Point2D[] = [];
        const steps = 36;
        for (let i = 0; i < steps; i++) {
            const theta = (i / steps) * 2 * Math.PI;
            const x = this.rx * Math.cos(theta);
            const y = this.ry * Math.sin(theta);
            points.push(this.transformPointToDevice(x, y));
        }

        return Bounds.fromPoints(points);
    }

    drawRaster(r: RasterRenderer): void
    {
        const points: Point2D[] = [];
        const steps = 36;
        for (let i = 0; i < steps; i++) {
            const theta = (i / steps) * 2 * Math.PI;
            const x = this.rx * Math.cos(theta);
            const y = this.ry * Math.sin(theta);
            points.push(this.transformPointToDevice(x, y));
        }

        if (this.fillOpacity > 0) 
        {
            r.fillPolygon(points, this.getFillColor());
        }

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) 
        {
            r.strokePolygon(points, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean 
    {
        const localPoint = this.transformPointToLocal(px, py);
        if (!localPoint) return false;

        const nx = localPoint.x / this.rx;
        const ny = localPoint.y / this.ry;
        return (nx * nx + ny * ny) <= 1;
    }

    toJSON(): any
    {
        return {
            type: 'Oval',
            rx: this.rx,
            ry: this.ry,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }
}