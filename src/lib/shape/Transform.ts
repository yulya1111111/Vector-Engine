import { Mat3, mat3 } from '../math/mat3';

export class Transform 
{
    x: number;
    y: number;
    rotation: number; // в радианах
    scaleX: number;
    scaleY: number;

    constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) 
    {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }

    toMatrix(): Mat3 
    {
        return mat3.fromTransform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }

    clone(): Transform 
    {
        return new Transform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }
}