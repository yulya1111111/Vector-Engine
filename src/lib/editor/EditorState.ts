import { Shape } from '../shape/Shape';
import { Point2D } from '../math/mat3';

// Режимы работы редактора
export type EditorMode = 
  | 'idle'          // ничего не делаем
  | 'move'          // перемещаем фигуру
  | 'resize'        // меняем размер
  | 'rotate'        // поворачиваем
  | 'edit-points';  // редактируем контрольные точки

// Типы "ручек" для изменения размера
export type ResizeHandle = 
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'rotate';

// Всё состояние редактора в одном месте
export interface EditorState {
  mode: EditorMode;
  selectedId: number | null;
  activeHandle: ResizeHandle | null;
  startPoint: Point2D | null;         // где начали действие
  startTransform: {                   // начальное состояние фигуры
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  } | null;
}

// Начальное состояние
export const initialEditorState: EditorState = {
  mode: 'idle',
  selectedId: null,
  activeHandle: null,
  startPoint: null,
  startTransform: null,
};