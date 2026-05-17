import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';

export class Rect extends Shape 
{
    w: number;
    h: number;

    constructor(w: number, h: number)
    {
        super();
        this.w = w;
        this.h = h;
    }

    getLocalBounds(): Bounds | null 
    {
        return new Bounds(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    }

    getBounds(): Bounds | null 
    {
        const localBounds = this.getLocalBounds();
        if (!localBounds) return null;

        const corners = [
            { x: localBounds.minX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.maxY },
            { x: localBounds.minX, y: localBounds.maxY },
        ];

        const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));
        return Bounds.fromPoints(deviceCorners);
    }

    drawRaster(r: RasterRenderer): void 
    {
        const localBounds = this.getLocalBounds();
        if (!localBounds) return;

        const corners = [
            { x: localBounds.minX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.maxY },
            { x: localBounds.minX, y: localBounds.maxY },
        ];

        const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));

        if (this.fillOpacity > 0) {
            r.fillPolygon(deviceCorners, this.getFillColor());
        }

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) 
        {
            r.strokePolygon(deviceCorners, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean 
    {
        const localPoint = this.transformPointToLocal(px, py);
        if (!localPoint) return false;

        const localBounds = this.getLocalBounds();
        if (!localBounds) return false;

        return localPoint.x >= localBounds.minX && localPoint.x <= localBounds.maxX &&
            localPoint.y >= localBounds.minY && localPoint.y <= localBounds.maxY;
    }

    toJSON(): any 
    {
        return {
            type: 'Rect',
            w: this.w,
            h: this.h,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }
}