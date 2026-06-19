﻿import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export class QuadraticBezier extends Shape 
{
    private _p0: Point2D;
    private _p1: Point2D;
    private _p2: Point2D;
    private _closed: boolean;

    constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, closed: boolean = false)
    {
        super();
        this._p0 = { x: x0, y: y0 };
        this._p1 = { x: x1, y: y1 };
        this._p2 = { x: x2, y: y2 };
        this._closed = closed;
    }

    // Геттеры для контрольных точек
    get p0(): Point2D { return { ...this._p0 }; }
    get p1(): Point2D { return { ...this._p1 }; }
    get p2(): Point2D { return { ...this._p2 }; }
    get closed(): boolean { return this._closed; }

    set p0(value: Point2D) { this._p0 = { ...value }; }
    set p1(value: Point2D) { this._p1 = { ...value }; }
    set p2(value: Point2D) { this._p2 = { ...value }; }
    set closed(value: boolean) { this._closed = value; }

    // evalLocal(t) — вычисление точки на кривой по формуле B(t)=(1−t)²p₀ + 2(1−t)tp₁ + t²p₂
    evalLocal(t: number): Point2D {
        const invT = 1 - t;
        const x = invT * invT * this._p0.x + 2 * invT * t * this._p1.x + t * t * this._p2.x;
        const y = invT * invT * this._p0.y + 2 * invT * t * this._p1.y + t * t * this._p2.y;
        return { x, y };
    }

    // flattenDevicePoints(flatness) — аппроксимация кривой ломаной в экранных координатах
    flattenDevicePoints(flatness: number): Point2D[] {
        const points: Point2D[] = [];
        const steps = this.calculateStepsForFlatness(flatness);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.evalLocal(t);
            points.push(this.transformPointToDevice(point.x, point.y));
        }
        return points;
    }

    // Методы для работы с контрольными точками
    getControlPoints(): Point2D[] {
        return [this._p0, this._p1, this._p2];
    }

    setControlPoint(idx: number, pt: Point2D): void {
        switch (idx) {
            case 0: this._p0 = { ...pt }; break;
            case 1: this._p1 = { ...pt }; break;
            case 2: this._p2 = { ...pt }; break;
            default: throw new Error(`Invalid control point index: ${idx}`);
        }
    }

    private calculateStepsForFlatness(flatness: number): number {
        // Оценка длины для определения необходимого количества шагов
        const len0 = Math.sqrt(Math.pow(this._p1.x - this._p0.x, 2) + Math.pow(this._p1.y - this._p0.y, 2));
        const len1 = Math.sqrt(Math.pow(this._p2.x - this._p1.x, 2) + Math.pow(this._p2.y - this._p1.y, 2));
        const maxLength = Math.max(len0, len1);
        // Больше шагов для плавности
        const steps = Math.max(20, Math.ceil(maxLength / flatness));
        return steps;
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

    getLocalBounds(): Bounds | null 
    {
        return Bounds.fromPoints([this._p0, this._p1, this._p2]);
    }

    getBounds(): Bounds | null 
    {
        // Вычисляем границы по точкам аппроксимации, не по контрольным точкам
        const flatness = 2; // Стандартная точность для вычисления границ
        const points = this.flattenDevicePoints(flatness);
        return Bounds.fromPoints(points);
    }

    drawRaster(r: RasterRenderer): void 
    {
        // Используем flattenDevicePoints для отрисовки
        const flatness = 1; // Более высокая точность для отрисовки
        const points = this.flattenDevicePoints(flatness);

        if (points.length < 2) return;

        if (this.fillOpacity > 0 && this._closed) {
            // Для замкнутой кривой добавляем первую точку в конец
            const closedPoints = [...points, points[0]];
            r.fillPolygon(closedPoints, this.getFillColor());
        }

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) {
            if (this._closed && points.length > 2) {
                // Замкнутая кривая - рисуем полигон
                r.strokePolygon(points, this.getStrokeColor(), this.strokeWidth);
            } else {
                // Открытая кривая - рисуем каждый сегмент отдельно
                for (let i = 0; i < points.length - 1; i++) {
                    r.strokeLine(
                        points[i].x, points[i].y,
                        points[i + 1].x, points[i + 1].y,
                        this.getStrokeColor(),
                        this.strokeWidth
                    );
                }
            }
        }
    }

    hitTest(px: number, py: number): boolean {
        const localP = this.transformPointToLocal(px, py);
        if (!localP) return false;
        
        // Аппроксимируем кривую и проверяем расстояние до каждого отрезка
        const flatness = this.strokeWidth / 2 + 2;
        const steps = this.calculateStepsForFlatness(flatness);
        const threshold = flatness;

        for (let i = 0; i < steps; i++) {
            const t1 = i / steps;
            const t2 = (i + 1) / steps;
            const p1 = this.evalLocal(t1);
            const p2 = this.evalLocal(t2);
            const dist = this.pointToSegmentDistance(localP.x, localP.y, p1.x, p1.y, p2.x, p2.y);
            if (dist <= threshold) {
                return true;
            }
        }
        return false;
    }

    toJSON(): any 
    {
        return {
            type: 'QuadraticBezier',
            p0: this._p0,
            p1: this._p1,
            p2: this._p2,
            closed: this._closed,
            transform: this.transform,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
            version: 1,
        };
    }

    clone(): QuadraticBezier {
        const cloned = new QuadraticBezier(
            this._p0.x, this._p0.y,
            this._p1.x, this._p1.y,
            this._p2.x, this._p2.y,
            this._closed
        );
        cloned.transform = this.transform.clone();
        cloned.fillStyle = this.fillStyle;
        cloned.fillOpacity = this.fillOpacity;
        cloned.strokeStyle = this.strokeStyle;
        cloned.strokeWidth = this.strokeWidth;
        cloned.strokeOpacity = this.strokeOpacity;
        return cloned;
    }
}