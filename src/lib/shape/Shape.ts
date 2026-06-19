﻿import { Mat3, mat3, Point2D } from '../math/mat3';
import { Transform } from './Transform';
import { Bounds } from './Bounds';
import { RasterRenderer, RGBA, hexToRGBA } from '../raster/RasterRender.ts';

let nextId = 1;

export abstract class Shape 
{
    id: number;
    transform: Transform;
    fillStyle: string;
    fillOpacity: number;
    strokeStyle: string;
    strokeWidth: number;
    strokeOpacity: number;

    constructor() {
        this.id = nextId++;
        this.transform = new Transform();
        this.fillStyle = '#000000';
        this.fillOpacity = 1.0;
        this.strokeStyle = '#000000';
        this.strokeWidth = 1;
        this.strokeOpacity = 1.0;
    }

    getLocalToDeviceMatrix(): Mat3 
    {
        return this.transform.toMatrix();
    }

    getDeviceToLocalMatrix(): Mat3 | null 
    {
        const localToDevice = this.getLocalToDeviceMatrix();
        return mat3.invert(localToDevice);
    }

    transformPointToDevice(px: number, py: number): Point2D 
    {
        const m = this.getLocalToDeviceMatrix();
        return mat3.transformPoint(m, px, py);
    }

    transformPointToLocal(px: number, py: number): Point2D | null 
    {
        const m = this.getDeviceToLocalMatrix();
        if (!m) return null;
        return mat3.transformPoint(m, px, py);
    }

    getCenter(): Point2D {
        const bounds = this.getBounds();
        if (!bounds) return { x: 0, y: 0 };
        return { x: bounds.centerX, y: bounds.centerY };
    }

    resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number)
    {
        const oldBounds = this.getBounds();
        if (!oldBounds) return;

        const oldCenter = oldBounds.centerX;
        const oldHeight = oldBounds.height;
        const oldWidth = oldBounds.width;

        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        const newCenterX = (minX + maxX) / 2;
        const newCenterY = (minY + maxY) / 2;

        if (oldWidth === 0 || oldHeight === 0) return;

        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;

        this.transform.x += newCenterX - oldCenter;
        this.transform.y += newCenterY - oldBounds.centerY;

        this.transform.scaleX *= scaleX;
        this.transform.scaleY *= scaleY;
    }

    setBounds(minX: number, minY: number, maxX: number, maxY: number) 
    {
        this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
    }

    clone(): Shape {
        const cloned = Object.create(Object.getPrototypeOf(this));
        Object.assign(cloned, this);
        cloned.id = nextId++;
        cloned.transform = this.transform.clone();
        return cloned;
    }

    abstract drawRaster(r: RasterRenderer): void;
    abstract hitTest(px: number, py: number): boolean;
    abstract getBounds(): Bounds | null;
    abstract getLocalBounds(): Bounds | null;
    abstract toJSON(): any;

    // Стандартная реализация для фигур без контрольных точек
    getControlPoints(): Point2D[] | null {
        return null;
    }

    setControlPoint(_idx: number, _pt: Point2D): void {
        throw new Error('setControlPoint не поддерживается для этой фигуры');
    }

    protected getFillColor(): RGBA
    {
        return hexToRGBA(this.fillStyle, Math.floor(this.fillOpacity * 255));
    }

    protected getStrokeColor(): RGBA
    {
        return hexToRGBA(this.strokeStyle, Math.floor(this.strokeOpacity * 255));
    }
}