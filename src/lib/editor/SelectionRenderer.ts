import { RasterRenderer, RGBA } from '../raster/RasterRender.ts';
import { Shape } from '../shape/Shape';

// Цвета для выделения
const SELECTION_COLOR: RGBA = { r: 0, g: 120, b: 255, a: 255 }; // синий
const HANDLE_COLOR: RGBA = { r: 255, g: 255, b: 255, a: 255 };   // белый
const HANDLE_SIZE = 7;       // размер ручки в пикселях
const PADDING = 4;           // отступ рамки от фигуры
const ROTATE_OFFSET = 25;    // расстояние ручки поворота от рамки

// Главная функция — рисует рамку и ручки вокруг выбранной фигуры
export function drawSelection(r: RasterRenderer, shape: Shape): void {
  const bounds = shape.getBounds();
  if (!bounds) return;

  // Вычисляем координаты рамки с отступом
  const minX = bounds.minX - PADDING;
  const minY = bounds.minY - PADDING;
  const maxX = bounds.maxX + PADDING;
  const maxY = bounds.maxY + PADDING;

  // 1. Рисуем прямоугольную рамку (синюю)
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  r.strokePolygon(corners, SELECTION_COLOR, 1);

  // 2. Рисуем 4 угловые ручки
  drawHandle(r, minX, minY);           // верх-лево
  drawHandle(r, maxX, minY);           // верх-право
  drawHandle(r, maxX, maxY);           // низ-право
  drawHandle(r, minX, maxY);           // низ-лево

  // 3. Рисуем ручку поворота (сверху по центру)
  const centerX = (minX + maxX) / 2;
  const rotateY = minY - ROTATE_OFFSET;

  // Линия от рамки к ручке поворота
  r.drawLine(centerX, minY, centerX, rotateY, SELECTION_COLOR);

  // Кружок-ручка поворота
  drawCircleHandle(r, centerX, rotateY, 5);
}

// Рисуем квадратную ручку (белый квадрат с синей рамкой)
function drawHandle(r: RasterRenderer, x: number, y: number): void {
  const half = HANDLE_SIZE / 2;
  const corners = [
    { x: x - half, y: y - half },
    { x: x + half, y: y - half },
    { x: x + half, y: y + half },
    { x: x - half, y: y + half },
  ];
  // Сначала белая заливка
  r.fillPolygon(corners, HANDLE_COLOR);
  // Потом синяя рамка
  r.strokePolygon(corners, SELECTION_COLOR, 1);
}

// Рисуем круглую ручку поворота
function drawCircleHandle(r: RasterRenderer, cx: number, cy: number, radius: number): void {
  // Аппроксимируем круг через многоугольник (20 точек)
  const points = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * 2 * Math.PI;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  r.fillPolygon(points, HANDLE_COLOR);
  r.strokePolygon(points, SELECTION_COLOR, 1);
}

// Определяем, какая ручка находится под курсором
export function getHandleAtPoint(
  x: number,
  y: number,
  shape: Shape
): 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'rotate' | null {
  const bounds = shape.getBounds();
  if (!bounds) return null;

  const minX = bounds.minX - PADDING;
  const minY = bounds.minY - PADDING;
  const maxX = bounds.maxX + PADDING;
  const maxY = bounds.maxY + PADDING;

  const threshold = HANDLE_SIZE + 2; // допуск в пикселях

  // Проверяем ручку поворота (сверху по центру)
  const centerX = (minX + maxX) / 2;
  const rotateY = minY - ROTATE_OFFSET;
  const distToRotate = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - rotateY, 2)
  );
  if (distToRotate < threshold + 3) {
    return 'rotate';
  }

  // Проверяем угловые ручки
  if (Math.abs(x - minX) < threshold && Math.abs(y - minY) < threshold) {
    return 'top-left';
  }
  if (Math.abs(x - maxX) < threshold && Math.abs(y - minY) < threshold) {
    return 'top-right';
  }
  if (Math.abs(x - maxX) < threshold && Math.abs(y - maxY) < threshold) {
    return 'bottom-right';
  }
  if (Math.abs(x - minX) < threshold && Math.abs(y - maxY) < threshold) {
    return 'bottom-left';
  }

  return null;
}