import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class Triangle extends Shape 
{
    p1: Point2D;
    p2: Point2D;
    p3: Point2D;

    constructor(w: number, h: number) 
    {
        super();

        this.p1 = { x: 0, y: -h / 2 };
        this.p2 = { x: -w / 2, y: h / 2 };
        this.p3 = { x: w / 2, y: h / 2 };
    }

    getLocalBounds(): Bounds | null
    {
        return Bounds.fromPoints([this.p1, this.p2, this.p3]);
    }

    getBounds(): Bounds | null 
    {
        const points = [
            this.transformPointToDevice(this.p1.x, this.p1.y),
            this.transformPointToDevice(this.p2.x, this.p2.y),
            this.transformPointToDevice(this.p3.x, this.p3.y),
        ];
        return Bounds.fromPoints(points);
    }

    drawRaster(r: RasterRenderer): void 
    {
        const devicePoints = [
            this.transformPointToDevice(this.p1.x, this.p1.y),
            this.transformPointToDevice(this.p2.x, this.p2.y),
            this.transformPointToDevice(this.p3.x, this.p3.y),
        ];

        if (this.fillOpacity > 0) 
        {
            r.fillPolygon(devicePoints, this.getFillColor());
        }

        if (this.strokeOpacity > 0 && this.strokeWidth > 0)
        {
            r.strokePolygon(devicePoints, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean 
    {
        const localP = this.transformPointToLocal(px, py);
        if (!localP) return false;
        
        const sign = (p1: Point2D, p2: Point2D, p3: Point2D) => {
            return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
        };

        const d1 = sign(localP, this.p1, this.p2);
        const d2 = sign(localP, this.p2, this.p3);
        const d3 = sign(localP, this.p3, this.p1);

        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

        // Если все знаки одинаковые (или ноль), точка внутри
        return !(hasNeg && hasPos);
    }

    toJSON(): any 
    {
        return {
            type: 'Triangle',
            p1: this.p1,
            p2: this.p2,
            p3: this.p3,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }
}