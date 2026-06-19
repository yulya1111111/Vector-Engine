import { Shape } from '../Shape';
import { Bounds } from '../Bounds';
import { RasterRenderer } from '../../raster/RasterRender.ts';
import { Point2D } from '../../math/mat3';

export type PathBezierMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    private _points: Point2D[];
    private _mode: PathBezierMode;
    private _closed: boolean;

    constructor(mode: PathBezierMode = 'polyline', closed: boolean = false) {
        super();
        this._points = [];
        this._mode = mode;
        this._closed = closed;
    }

    // Геттеры
    get points(): Point2D[] { return this._points.map(p => ({ ...p })); }
    get mode(): PathBezierMode { return this._mode; }
    get closed(): boolean { return this._closed; }

    set mode(value: PathBezierMode) { this._mode = value; }
    set closed(value: boolean) { this._closed = value; }

    // evalLocal(t) — вычисление точки на пути по параметру t (0 <= t <= 1)
    evalLocal(t: number): Point2D {
        if (this._points.length === 0) return { x: 0, y: 0 };
        if (this._points.length === 1) return { ...this._points[0] };

        const clampedT = Math.max(0, Math.min(1, t));
        const segmentCount = this._closed ? this._points.length : this._points.length - 1;
        
        if (segmentCount === 0) return { ...this._points[0] };

        const segmentT = clampedT * segmentCount;
        const segmentIndex = Math.floor(segmentT);
        const localT = segmentT - segmentIndex;

        const p1Index = segmentIndex % this._points.length;
        const p2Index = (segmentIndex + 1) % this._points.length;

        const p1 = this._points[p1Index];
        const p2 = this._points[p2Index];

        return {
            x: p1.x + (p2.x - p1.x) * localT,
            y: p1.y + (p2.y - p1.y) * localT
        };
    }

    // flattenDevicePoints(flatness) — аппроксимация пути ломаной
    flattenDevicePoints(flatness: number): Point2D[] {
        if (this._points.length === 0) return [];

        switch (this._mode) 
        {
            case 'polyline':
                return this.flattenPolyline(flatness);
            case 'bezier':
                return this.flattenBeziers(flatness);
            case 'catmull':
                return this.flattenCatmull(flatness);
            default:
                return this.flattenPolyline(flatness);
        }
    }

    private flattenPolyline(_flatness: number): Point2D[] {
        const result: Point2D[] = [];
        const endIndex = this._closed ? this._points.length : this._points.length - 1;
        
        for (let i = 0; i < endIndex; i++) {
            const p = this._points[i];
            result.push(this.transformPointToDevice(p.x, p.y));
        }
        
        if (this._closed && this._points.length > 0) {
            result.push(this.transformPointToDevice(this._points[0].x, this._points[0].y));
        }
        
        return result;
    }

    private flattenBeziers(flatness: number): Point2D[] {
        const result: Point2D[] = [];
        const bezierCount = Math.floor(this._points.length / 4);
        
        for (let i = 0; i < bezierCount; i++) {
            const baseIndex = i * 4;
            const p0 = this._points[baseIndex];
            const p1 = this._points[baseIndex + 1];
            const p2 = this._points[baseIndex + 2];
            const p3 = this._points[baseIndex + 3];

            const segmentPoints = this.flattenCubicBezier(p0, p1, p2, p3, flatness);
            
            if (result.length > 0 && segmentPoints.length > 0) {
                result.pop(); // Убираем последнюю точку, чтобы не дублировать
            }
            result.push(...segmentPoints);
        }
        
        return result;
    }

    private flattenCubicBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, flatness: number): Point2D[] {
        const points: Point2D[] = [];
        
        // Улучшенный расчёт количества шагов для плавности кривой
        const len0 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
        const len1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const len2 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
        const maxLength = Math.max(len0, Math.max(len1, len2));
        
        // Больше шагов для более плавной кривой
        const steps = Math.max(20, Math.ceil(maxLength / flatness));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const invT = 1 - t;
            const x = Math.pow(invT, 3) * p0.x +
                3 * Math.pow(invT, 2) * t * p1.x +
                3 * invT * Math.pow(t, 2) * p2.x +
                Math.pow(t, 3) * p3.x;
            const y = Math.pow(invT, 3) * p0.y +
                3 * Math.pow(invT, 2) * t * p1.y +
                3 * invT * Math.pow(t, 2) * p2.y +
                Math.pow(t, 3) * p3.y;
            points.push(this.transformPointToDevice(x, y));
        }
        return points;
    }

    // catmullToBeziers() — преобразование Catmull-Rom сплайна в кубические кривые Безье
    catmullToBeziers(): Point2D[] {
        const beziers: Point2D[] = [];
        const n = this._points.length;
        
        if (n < 2) return this._points.map(p => ({ ...p }));
        if (n === 2) {
            // Для двух точек просто линия
            return [this._points[0], this._points[1], this._points[1], this._points[1]];
        }

        // Для Catmull-Rom:
        // - Открытый сплайн: numSegments = n - 1 (проходит через все точки)
        // - Замкнутый: numSegments = n (полный цикл)
        const numSegments = this._closed ? n : n - 1;

        for (let i = 0; i < numSegments; i++) {
            let p0Idx, p1Idx, p2Idx, p3Idx;
            
            if (this._closed) {
                // Замкнутый сплайн: все индексы по модулю n
                p0Idx = (i - 1 + n) % n;
                p1Idx = i;
                p2Idx = (i + 1) % n;
                p3Idx = (i + 2) % n;
            } else {
                // Открытый сплайн: 
                // Последний сегмент использует последнюю точку дважды для p3
                p0Idx = i === 0 ? 0 : i - 1;
                p1Idx = i;
                p2Idx = (i + 1) % n;
                p3Idx = i === n - 2 ? n - 1 : i + 2;
            }

            const p0 = this._points[p0Idx];
            const p1 = this._points[p1Idx];
            const p2 = this._points[p2Idx];
            const p3 = this._points[p3Idx];

            // Catmull-Rom в Cubic Bezier конвертация
            // alpha = 0 (кардинальный сплайн) дает tension = 0.5
            const tension = 0.5;
            
            const cp1x = p1.x + (p2.x - p0.x) * tension / 2;
            const cp1y = p1.y + (p2.y - p0.y) * tension / 2;
            const cp2x = p2.x - (p3.x - p1.x) * tension / 2;
            const cp2y = p2.y - (p3.y - p1.y) * tension / 2;

            beziers.push({ ...p1 }, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, { ...p2 });
        }

        return beziers;
    }

    private flattenCatmull(flatness: number): Point2D[] {
        const bezierPoints = this.catmullToBeziers();
        if (bezierPoints.length < 4) {
            return this.flattenPolyline(flatness);
        }

        const result: Point2D[] = [];
        const bezierCount = bezierPoints.length / 4;

        for (let i = 0; i < bezierCount; i++) {
            const baseIndex = i * 4;
            const p0 = bezierPoints[baseIndex];
            const p1 = bezierPoints[baseIndex + 1];
            const p2 = bezierPoints[baseIndex + 2];
            const p3 = bezierPoints[baseIndex + 3];

            const segmentPoints = this.flattenCubicBezier(p0, p1, p2, p3, flatness);
            
            if (result.length > 0 && segmentPoints.length > 0) {
                result.pop();
            }
            result.push(...segmentPoints);
        }

        return result;
    }

    // Методы управления точками
    addPointLocal(x: number, y: number): void {
        this._points.push({ x, y });
    }

    addPoint(point: Point2D): void {
        this._points.push({ ...point });
    }

    /**
     * Добавляет новую точку в путь в заданных координатах
     * @param point - точка в локальных координатах для добавления
     * @returns индекс добавленной точки
     */
    insertPointNear(point: Point2D): number {
        // Для всех режимов просто добавляем точку в конец списка
        // Для polyline - это логично (добавляем следующую вершину)
        // Для bezier/catmull - новые точки будут использоваться для построения кривой
        this._points.push({ ...point });
        return this._points.length - 1;
    }

    removePoint(index: number): void {
        if (index >= 0 && index < this._points.length) {
            this._points.splice(index, 1);
        }
    }

    setPoint(index: number, point: Point2D): void {
        if (index >= 0 && index < this._points.length) {
            this._points[index] = { ...point };
        }
    }

    getPoint(index: number): Point2D | null {
        if (index >= 0 && index < this._points.length) {
            return { ...this._points[index] };
        }
        return null;
    }

    // Методы для работы с контрольными точками (интерфейс Shape)
    getControlPoints(): Point2D[] {
        return this._points.map(p => ({ ...p }));
    }

    setControlPoint(idx: number, pt: Point2D): void {
        if (idx >= 0 && idx < this._points.length) {
            this._points[idx] = { ...pt };
        } else {
            throw new Error(`Invalid control point index: ${idx}`);
        }
    }

    getLocalBounds(): Bounds | null {
        if (this._points.length === 0) return null;
        return Bounds.fromPoints(this._points);
    }

    getBounds(): Bounds | null {
        const flatness = 5;
        const points = this.flattenDevicePoints(flatness);
        return Bounds.fromPoints(points);
    }

    drawRaster(r: RasterRenderer): void {
        const flatness = 1;
        const points = this.flattenDevicePoints(flatness);

        if (points.length < 2) return;

        if (this.fillOpacity > 0 && this._closed && points.length > 2) {
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

        const flatness = this.strokeWidth / 2 + 2;
        const threshold = flatness;

        switch (this._mode) {
            case 'polyline':
                return this.hitTestPolyline(localP, threshold);
            case 'bezier':
                return this.hitTestBeziers(localP, threshold);
            case 'catmull':
                return this.hitTestCatmull(localP, threshold);
            default:
                return this.hitTestPolyline(localP, threshold);
        }
    }

    private hitTestPolyline(localP: Point2D, threshold: number): boolean {
        const points = this._points;
        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToSegmentDistance(
                localP.x, localP.y,
                points[i].x, points[i].y,
                points[i + 1].x, points[i + 1].y
            );
            if (dist <= threshold) return true;
        }
        
        if (this._closed && points.length > 1) {
            const dist = this.pointToSegmentDistance(
                localP.x, localP.y,
                points[points.length - 1].x, points[points.length - 1].y,
                points[0].x, points[0].y
            );
            if (dist <= threshold) return true;
        }
        
        return false;
    }

    private hitTestBeziers(localP: Point2D, threshold: number): boolean {
        const bezierCount = Math.floor(this._points.length / 4);
        
        for (let i = 0; i < bezierCount; i++) {
            const baseIndex = i * 4;
            const p0 = this._points[baseIndex];
            const p1 = this._points[baseIndex + 1];
            const p2 = this._points[baseIndex + 2];
            const p3 = this._points[baseIndex + 3];

            if (this.hitTestCubicBezier(localP, p0, p1, p2, p3, threshold)) {
                return true;
            }
        }
        
        return false;
    }

    private hitTestCubicBezier(
        localP: Point2D,
        p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D,
        threshold: number
    ): boolean {
        const steps = 50;
        for (let i = 0; i < steps; i++) {
            const t1 = i / steps;
            const t2 = (i + 1) / steps;
            const bp1 = this.evalCubicPoint(t1, p0, p1, p2, p3);
            const bp2 = this.evalCubicPoint(t2, p0, p1, p2, p3);
            const dist = this.pointToSegmentDistance(localP.x, localP.y, bp1.x, bp1.y, bp2.x, bp2.y);
            if (dist <= threshold) return true;
        }
        return false;
    }

    private evalCubicPoint(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
        const invT = 1 - t;
        return {
            x: Math.pow(invT, 3) * p0.x +
                3 * Math.pow(invT, 2) * t * p1.x +
                3 * invT * Math.pow(t, 2) * p2.x +
                Math.pow(t, 3) * p3.x,
            y: Math.pow(invT, 3) * p0.y +
                3 * Math.pow(invT, 2) * t * p1.y +
                3 * invT * Math.pow(t, 2) * p2.y +
                Math.pow(t, 3) * p3.y
        };
    }

    private hitTestCatmull(localP: Point2D, threshold: number): boolean {
        const bezierPoints = this.catmullToBeziers();
        const bezierCount = Math.floor(bezierPoints.length / 4);
        
        for (let i = 0; i < bezierCount; i++) {
            const baseIndex = i * 4;
            const p0 = bezierPoints[baseIndex];
            const p1 = bezierPoints[baseIndex + 1];
            const p2 = bezierPoints[baseIndex + 2];
            const p3 = bezierPoints[baseIndex + 3];

            if (this.hitTestCubicBezier(localP, p0, p1, p2, p3, threshold)) {
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
            type: 'PathBezier',
            points: this._points,
            mode: this._mode,
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

    clone(): PathBezier {
        const cloned = new PathBezier(this._mode, this._closed);
        cloned._points = this._points.map(p => ({ ...p }));
        cloned.transform = this.transform.clone();
        cloned.fillStyle = this.fillStyle;
        cloned.fillOpacity = this.fillOpacity;
        cloned.strokeStyle = this.strokeStyle;
        cloned.strokeWidth = this.strokeWidth;
        cloned.strokeOpacity = this.strokeOpacity;
        return cloned;
    }
}