import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class Triangle extends Shape 
{
    private _p1: Point2D;
    private _p2: Point2D;
    private _p3: Point2D;

    constructor(w: number, h: number) 
    {
        super();

        // Вычисляем центр масс и сохраняем вершины относительно него
        const cx = (0 + (-w / 2) + (w / 2)) / 3;
        const cy = ((-h / 2) + (h / 2) + (h / 2)) / 3;

        this._p1 = { x: 0 - cx, y: -h / 2 - cy };
        this._p2 = { x: -w / 2 - cx, y: h / 2 - cy };
        this._p3 = { x: w / 2 - cx, y: h / 2 - cy };
    }

    // Геттеры для вершин
    get p1(): Point2D { return { ...this._p1 }; }
    get p2(): Point2D { return { ...this._p2 }; }
    get p3(): Point2D { return { ...this._p3 }; }

    // Методы для работы с контрольными точками (согласно спецификации)
    getControlPoints(): Point2D[] {
        return [this._p1, this._p2, this._p3];
    }

    setControlPoint(idx: number, pt: Point2D): void {
        switch (idx) {
            case 0: this._p1 = { ...pt }; break;
            case 1: this._p2 = { ...pt }; break;
            case 2: this._p3 = { ...pt }; break;
            default: throw new Error(`Invalid control point index: ${idx}`);
        }
    }

    // evalLocal не применим для треугольника (это не кривая)
    evalLocal(_t: number): Point2D {
        throw new Error('evalLocal is not applicable for Triangle');
    }

    // flattenDevicePoints для аппроксимации (треугольник уже является ломаной)
    flattenDevicePoints(_flatness: number): Point2D[] {
        return [
            this.transformPointToDevice(this._p1.x, this._p1.y),
            this.transformPointToDevice(this._p2.x, this._p2.y),
            this.transformPointToDevice(this._p3.x, this._p3.y),
        ];
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
            id: this.id,     
            p1: this._p1,
            p2: this._p2,
            p3: this._p3,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
            version: 1,
        };
    }

    clone(): Triangle {
        const cloned = new Triangle(1, 1);
        cloned._p1 = { ...this._p1 };
        cloned._p2 = { ...this._p2 };
        cloned._p3 = { ...this._p3 };
        cloned.transform = this.transform.clone();
        cloned.fillStyle = this.fillStyle;
        cloned.fillOpacity = this.fillOpacity;
        cloned.strokeStyle = this.strokeStyle;
        cloned.strokeWidth = this.strokeWidth;
        cloned.strokeOpacity = this.strokeOpacity;
        return cloned;
    }
}