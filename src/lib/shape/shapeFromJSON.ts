import { Shape } from './Shape';
import { Rect } from './subClasses/Rect';
import { Line } from './subClasses/Line';
import { Oval } from './subClasses/Oval';
import { Triangle } from './subClasses/Triangle';
import { QuadraticBezier } from './subClasses/QuadraticBezier';
import { CubicBezier } from './subClasses/CubicBezier';
import { PathBezier } from './subClasses/PathBezier';

export function shapeFromJSON(data: any): Shape | null {
    if (!data || !data.type) {
        console.warn('Invalid shape data:', data);
        return null;
    }

    let shape: Shape;

    switch (data.type) {
        case 'Rect':
            shape = new Rect(data.w, data.h);
            break;

        case 'Line':
            shape = new Line(data.x1, data.y1, data.x2, data.y2);
            break;

        case 'Oval':
            shape = new Oval(data.rx, data.ry);
            break;

        case 'Triangle':
            // Если Triangle хранит точки, нужно адаптировать
            shape = new Triangle(data.w || 100, data.h || 100);
            break;

        case 'QuadraticBezier':
            shape = new QuadraticBezier(
                data.p0.x, data.p0.y,
                data.p1.x, data.p1.y,
                data.p2.x, data.p2.y,
                data.closed
            );
            break;

        case 'CubicBezier':
            shape = new CubicBezier(
                data.p0.x, data.p0.y,
                data.p1.x, data.p1.y,
                data.p2.x, data.p2.y,
                data.p3.x, data.p3.y,
                data.closed
            );
            break;

        case 'PathBezier':
            shape = new PathBezier(data.mode, data.closed);
            // Восстанавливаем точки
            if (data.points && Array.isArray(data.points)) {
                for (const pt of data.points) {
                    (shape as PathBezier).addPointLocal(pt.x, pt.y);
                }
            }
            break;

        default:
            console.warn(`Unknown shape type: ${data.type}`);
            return null;
    }

    // Восстанавливаем общие свойства из базового класса Shape
    if (data.transform) {
        shape.transform.x = data.transform.x ?? 0;
        shape.transform.y = data.transform.y ?? 0;
        shape.transform.rotation = data.transform.rotation ?? 0;
        shape.transform.scaleX = data.transform.scaleX ?? 1;
        shape.transform.scaleY = data.transform.scaleY ?? 1;
    }

    shape.fillStyle = data.fillStyle ?? '#000000';
    shape.fillOpacity = data.fillOpacity ?? 1;
    shape.strokeStyle = data.strokeStyle ?? '#000000';
    shape.strokeWidth = data.strokeWidth ?? 1;
    shape.strokeOpacity = data.strokeOpacity ?? 1;

    // Если у фигуры есть id, восстанавливаем его
    if (data.id !== undefined) {
        shape.id = data.id;
    }

    return shape;
}