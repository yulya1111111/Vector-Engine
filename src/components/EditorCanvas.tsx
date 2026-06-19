import { useEffect, useRef, useState, useCallback } from "react";
import { RasterRenderer } from "../lib/raster/RasterRender";
import { Shape } from "../lib/shape/Shape";
import { Rect } from "../lib/shape/subClasses/Rect";
import { Oval } from "../lib/shape/subClasses/Oval";
import { PathBezier } from "../lib/shape/subClasses/PathBezier";
import { Triangle } from "../lib/shape/subClasses/Triangle";
import { Line } from "../lib/shape/subClasses/Line";
import { QuadraticBezier } from "../lib/shape/subClasses/QuadraticBezier";
import { CubicBezier } from "../lib/shape/subClasses/CubicBezier";
import { Point2D } from "../lib/math/mat3";

type EditorMode = 'idle' | 'move' | 'resize' | 'rotate' | 'editPoints' | 'addPoint';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

interface ShapeStartData {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    width?: number;
    height?: number;
}

interface HistoryState {
    shapes: Shape[];
    selectedShapeId: number | null;
}

// НОВОЕ: интерфейс пропсов
interface EditorCanvasProps {
    initialShapes?: Shape[];
    onSave?: (shapes: Shape[]) => void;
}

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 40;
const MIN_SIZE = 10;

// НОВОЕ: функция принимает пропсы
export default function EditorCanvas({ initialShapes = [], onSave }: EditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);

    // ИЗМЕНЕНО: начальное значение из initialShapes
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
    const [mode, setMode] = useState<EditorMode>('idle');
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
    const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | 'rotate' | null>(null);
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
    const [hoveredShapeId, setHoveredShapeId] = useState<number | null>(null);
    const [addPointPosition, setAddPointPosition] = useState<Point2D | null>(null);
    const [cursorPos, setCursorPos] = useState<Point2D>({ x: 0, y: 0 });
    const isAddPointMode = mode === 'addPoint';
    const historyRef = useRef<HistoryState[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const startDataRef = useRef<ShapeStartData | null>(null);
    const startPointRef = useRef<Point2D | null>(null);
    const editPointIndexRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const addToHistoryDirect = useCallback((shapesToAdd: Shape[], selectedId: number | null) => {
        const copiedShapes = shapesToAdd.map(s => {
            const cloned = s.clone();
            return cloned;
        });

        let newSelectedId = selectedId;
        if (selectedId !== null) {
            const originalIndex = shapesToAdd.findIndex(s => s.id === selectedId);
            if (originalIndex !== -1 && originalIndex < copiedShapes.length) {
                newSelectedId = copiedShapes[originalIndex].id;
            }
        }

        const newState: HistoryState = {
            shapes: copiedShapes,
            selectedShapeId: newSelectedId,
        };
        
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(newState);
        historyIndexRef.current++;
    }, []);

    const addToHistory = useCallback(() => {
        addToHistoryDirect(shapes, selectedShapeId);
    }, [shapes, selectedShapeId, addToHistoryDirect]);

    const undo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const state = historyRef.current[historyIndexRef.current];
            setShapes(state.shapes);
            setSelectedShapeId(state.selectedShapeId);
        }
    }, []);

    const redo = useCallback(() => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const state = historyRef.current[historyIndexRef.current];
            setShapes(state.shapes);
            setSelectedShapeId(state.selectedShapeId);
        }
    }, []);

    const createRectangle = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newRect = new Rect(100, 100);
        newRect.transform.x = renderer.width / 2;
        newRect.transform.y = renderer.height / 2;
        newRect.fillStyle = "#0088ff";
        newRect.fillOpacity = 0.8;
        newRect.strokeStyle = "#000000";
        newRect.strokeWidth = 2;

        const updatedShapes = [...shapes, newRect];
        setShapes(updatedShapes);
        setSelectedShapeId(newRect.id);
        addToHistoryDirect(updatedShapes, newRect.id);
    }, [shapes, addToHistoryDirect]);

    const createEllipse = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newOval = new Oval(60, 40);
        newOval.transform.x = renderer.width / 2;
        newOval.transform.y = renderer.height / 2;
        newOval.fillStyle = "#ff0000";
        newOval.fillOpacity = 0.6;
        newOval.strokeStyle = "#ffffff";
        newOval.strokeWidth = 2;

        const updatedShapes = [...shapes, newOval];
        setShapes(updatedShapes);
        setSelectedShapeId(newOval.id);
        addToHistoryDirect(updatedShapes, newOval.id);
    }, [shapes, addToHistoryDirect]);

    const createBezierCurve = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newBezier = new PathBezier('catmull', false);
        
        newBezier.addPointLocal(-50, -50);
        newBezier.addPointLocal(-25, 50);
        newBezier.addPointLocal(25, -50);
        newBezier.addPointLocal(50, 50);

        newBezier.transform.x = renderer.width / 2;
        newBezier.transform.y = renderer.height / 2;
        newBezier.strokeStyle = "#ffaa00";
        newBezier.strokeWidth = 3;
        newBezier.fillOpacity = 0;

        const updatedShapes = [...shapes, newBezier];
        setShapes(updatedShapes);
        setSelectedShapeId(newBezier.id);
        addToHistoryDirect(updatedShapes, newBezier.id);
    }, [shapes, addToHistoryDirect]);

    const createTriangle = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newTriangle = new Triangle(100, 100);
        newTriangle.transform.x = renderer.width / 2;
        newTriangle.transform.y = renderer.height / 2;
        newTriangle.fillStyle = "#00ff88";
        newTriangle.fillOpacity = 0.7;
        newTriangle.strokeStyle = "#ffffff";
        newTriangle.strokeWidth = 2;

        const updatedShapes = [...shapes, newTriangle];
        setShapes(updatedShapes);
        setSelectedShapeId(newTriangle.id);
        addToHistoryDirect(updatedShapes, newTriangle.id);
    }, [shapes, addToHistoryDirect]);

    const createLine = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newLine = new Line(-50, 0, 50, 0);
        newLine.transform.x = renderer.width / 2;
        newLine.transform.y = renderer.height / 2;
        newLine.strokeStyle = "#ff00ff";
        newLine.strokeWidth = 3;
        newLine.fillOpacity = 0;

        const updatedShapes = [...shapes, newLine];
        setShapes(updatedShapes);
        setSelectedShapeId(newLine.id);
        addToHistoryDirect(updatedShapes, newLine.id);
    }, [shapes, addToHistoryDirect]);

    const createQuadraticBezier = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newQuad = new QuadraticBezier(-50, 50, 0, -50, 50, 50, false);
        newQuad.transform.x = renderer.width / 2;
        newQuad.transform.y = renderer.height / 2;
        newQuad.strokeStyle = "#00ffff";
        newQuad.strokeWidth = 3;
        newQuad.fillOpacity = 0.5;

        const updatedShapes = [...shapes, newQuad];
        setShapes(updatedShapes);
        setSelectedShapeId(newQuad.id);
        addToHistoryDirect(updatedShapes, newQuad.id);
    }, [shapes, addToHistoryDirect]);

    const createCubicBezier = useCallback(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const newCubic = new CubicBezier(-50, 50, -25, -50, 25, 50, 50, -50, false);
        newCubic.transform.x = renderer.width / 2;
        newCubic.transform.y = renderer.height / 2;
        newCubic.strokeStyle = "#ff6600";
        newCubic.strokeWidth = 3;
        newCubic.fillOpacity = 0.5;

        const updatedShapes = [...shapes, newCubic];
        setShapes(updatedShapes);
        setSelectedShapeId(newCubic.id);
        addToHistoryDirect(updatedShapes, newCubic.id);
    }, [shapes, addToHistoryDirect]);

    const deleteSelected = useCallback(() => {
        if (selectedShapeId === null) return;

        const updatedShapes = shapes.filter(s => s.id !== selectedShapeId);
        setShapes(updatedShapes);
        setSelectedShapeId(null);
        addToHistoryDirect(updatedShapes, null);
    }, [shapes, selectedShapeId, addToHistoryDirect]);

    const toggleCurveClosed = useCallback(() => {
        if (selectedShapeId === null) return;

        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) return;

        if ('closed' in shape) {
            const curveShape = shape as any;
            const newClosed = !curveShape.closed;
            curveShape.closed = newClosed;
            
            const updatedShapes = [...shapes];
            setShapes(updatedShapes);
            addToHistoryDirect(updatedShapes, selectedShapeId);
        }
    }, [shapes, selectedShapeId, addToHistoryDirect]);

    const isCurveSelected = useCallback(() => {
        if (selectedShapeId === null) return false;
        const shape = shapes.find(s => s.id === selectedShapeId);
        return shape !== undefined && 'closed' in shape;
    }, [shapes, selectedShapeId]);

    const toggleAddPointMode = useCallback(() => {
        setMode(prev => prev === 'addPoint' ? 'idle' : 'addPoint');
        setAddPointPosition(null);
    }, []);

    const moveShapeForward = useCallback((shapeId: number) => {
        const index = shapes.findIndex(s => s.id === shapeId);
        if (index === -1 || index === shapes.length - 1) return;

        const updatedShapes = [...shapes];
        [updatedShapes[index], updatedShapes[index + 1]] = [updatedShapes[index + 1], updatedShapes[index]];
        setShapes(updatedShapes);
        addToHistoryDirect(updatedShapes, selectedShapeId);
    }, [shapes, selectedShapeId, addToHistoryDirect]);

    const moveShapeBackward = useCallback((shapeId: number) => {
        const index = shapes.findIndex(s => s.id === shapeId);
        if (index === -1 || index === 0) return;

        const updatedShapes = [...shapes];
        [updatedShapes[index], updatedShapes[index - 1]] = [updatedShapes[index - 1], updatedShapes[index]];
        setShapes(updatedShapes);
        addToHistoryDirect(updatedShapes, selectedShapeId);
    }, [shapes, selectedShapeId, addToHistoryDirect]);

    const getShapeAtPoint = useCallback((px: number, py: number): Shape | null => {
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].hitTest(px, py)) {
                return shapes[i];
            }
        }
        return null;
    }, [shapes]);

    const getShapeBoundsCorners = useCallback((shape: Shape): Point2D[] | null => {
        const bounds = shape.getBounds();
        if (!bounds) return null;

        return [
            { x: bounds.minX, y: bounds.minY },
            { x: bounds.minX + bounds.width / 2, y: bounds.minY },
            { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.minY + bounds.height / 2 },
            { x: bounds.maxX, y: bounds.maxY },
            { x: bounds.minX + bounds.width / 2, y: bounds.maxY },
            { x: bounds.minX, y: bounds.maxY },
            { x: bounds.minX, y: bounds.minY + bounds.height / 2 },
        ];
    }, []);

    const getHandleAtPoint = useCallback((shape: Shape, px: number, py: number): ResizeHandle | 'rotate' | null => {
        const bounds = shape.getBounds();
        if (!bounds) return null;

        const corners = getShapeBoundsCorners(shape);
        if (!corners) return null;

        const handles: [ResizeHandle, Point2D][] = [
            ['nw', corners[0]],
            ['n', corners[1]],
            ['ne', corners[2]],
            ['e', corners[3]],
            ['se', corners[4]],
            ['s', corners[5]],
            ['sw', corners[6]],
            ['w', corners[7]],
        ];

        for (const [handle, pos] of handles) {
            const dist = Math.hypot(px - pos.x, py - pos.y);
            if (dist <= HANDLE_SIZE) {
                return handle;
            }
        }

        const center = { x: bounds.centerX, y: bounds.centerY };
        const topMid = corners[1];
        const dir = Math.atan2(topMid.y - center.y, topMid.x - center.x);
        const rotHandleX = center.x + Math.cos(dir) * ROTATION_HANDLE_DISTANCE;
        const rotHandleY = center.y + Math.sin(dir) * ROTATION_HANDLE_DISTANCE;
        const rotDist = Math.hypot(px - rotHandleX, py - rotHandleY);
        if (rotDist <= HANDLE_SIZE) {
            return 'rotate';
        }

        return null;
    }, [getShapeBoundsCorners]);

    const getPointAtPosition = useCallback((shape: Shape, px: number, py: number): number | null => {
        const points = shape.getControlPoints?.();
        if (!points) return null;

        for (let i = 0; i < points.length; i++) {
            const devicePoint = shape.transformPointToDevice(points[i].x, points[i].y);
            const dist = Math.hypot(px - devicePoint.x, py - devicePoint.y);
            if (dist <= HANDLE_SIZE + 2) {
                return i;
            }
        }
        return null;
    }, []);

    const getDevicePixelRatio = useCallback(() => {
        return window.devicePixelRatio || 1;
    }, []);

    const getDeviceCoordinates = useCallback((clientX: number, clientY: number): Point2D => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const dpr = getDevicePixelRatio();
        
        return {
            x: (clientX - rect.left) * dpr,
            y: (clientY - rect.top) * dpr,
        };
    }, [getDevicePixelRatio]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const point = getDeviceCoordinates(e.clientX, e.clientY);
        const selectedShape = selectedShapeId ? shapes.find(s => s.id === selectedShapeId) : null;

        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);

        if (isAddPointMode && selectedShape && selectedShape.constructor.name === 'PathBezier') {
            const pathBezier = selectedShape as PathBezier;
            
            const localPoint = pathBezier.transformPointToLocal(point.x, point.y);
            if (localPoint) {
                pathBezier.insertPointNear(localPoint);
                
                const updatedShapes = [...shapes];
                setShapes(updatedShapes);
                addToHistoryDirect(updatedShapes, selectedShapeId);
                setAddPointPosition(null);
            }
            return;
        }

        if (selectedShape) {
            const handle = getHandleAtPoint(selectedShape, point.x, point.y);
            if (handle === 'rotate') {
                setMode('rotate');
                startPointRef.current = point;
                startDataRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                    scaleX: selectedShape.transform.scaleX,
                    scaleY: selectedShape.transform.scaleY,
                    rotation: selectedShape.transform.rotation,
                };
                return;
            } else if (handle) {
                setMode('resize');
                setResizeHandle(handle);
                startPointRef.current = point;
                const bounds = selectedShape.getBounds();
                if (bounds) {
                    startDataRef.current = {
                        x: selectedShape.transform.x,
                        y: selectedShape.transform.y,
                        scaleX: selectedShape.transform.scaleX,
                        scaleY: selectedShape.transform.scaleY,
                        rotation: selectedShape.transform.rotation,
                        width: bounds.width,
                        height: bounds.height,
                    };
                }
                return;
            } else {
                const pointIndex = getPointAtPosition(selectedShape, point.x, point.y);
                if (pointIndex !== null) {
                    setMode('editPoints');
                    editPointIndexRef.current = pointIndex;
                    startPointRef.current = point;
                    startDataRef.current = {
                        x: selectedShape.transform.x,
                        y: selectedShape.transform.y,
                        scaleX: selectedShape.transform.scaleX,
                        scaleY: selectedShape.transform.scaleY,
                        rotation: selectedShape.transform.rotation,
                    };
                    return;
                }
            }

            if (selectedShape.hitTest(point.x, point.y)) {
                setMode('move');
                startPointRef.current = point;
                startDataRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                    scaleX: selectedShape.transform.scaleX,
                    scaleY: selectedShape.transform.scaleY,
                    rotation: selectedShape.transform.rotation,
                };
                return;
            }
        }

        const shape = getShapeAtPoint(point.x, point.y);
        if (shape) {
            setSelectedShapeId(shape.id);
            setMode('move');
            startPointRef.current = point;
            startDataRef.current = {
                x: shape.transform.x,
                y: shape.transform.y,
                scaleX: shape.transform.scaleX,
                scaleY: shape.transform.scaleY,
                rotation: shape.transform.rotation,
            };
        } else {
            setSelectedShapeId(null);
            setMode('idle');
        }
    }, [
        getDeviceCoordinates,
        selectedShapeId,
        shapes,
        getHandleAtPoint,
        getPointAtPosition,
        getShapeAtPoint,
        isAddPointMode,
        addToHistoryDirect,
    ]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const point = getDeviceCoordinates(e.clientX, e.clientY);
        setCursorPos(point);

        const selectedShape = selectedShapeId ? shapes.find(s => s.id === selectedShapeId) : null;

        if (isAddPointMode && selectedShape && selectedShape.constructor.name === 'PathBezier') {
            setAddPointPosition(point);
            return;
        } else if (isAddPointMode) {
            setAddPointPosition(null);
        }

        if (!selectedShape) {
            setHoveredHandle(null);
            setHoveredPointIndex(null);
            const hoveredShape = getShapeAtPoint(point.x, point.y);
            setHoveredShapeId(hoveredShape?.id || null);
            return;
        }

        if (mode === 'idle') {
            const handle = getHandleAtPoint(selectedShape, point.x, point.y);
            setHoveredHandle(handle);

            if (!handle) {
                const pointIndex = getPointAtPosition(selectedShape, point.x, point.y);
                setHoveredPointIndex(pointIndex);
            } else {
                setHoveredPointIndex(null);
            }
        }

        if (mode === 'move' && startPointRef.current && startDataRef.current) {
            const deltaX = point.x - startPointRef.current.x;
            const deltaY = point.y - startPointRef.current.y;

            selectedShape.transform.x = startDataRef.current.x + deltaX;
            selectedShape.transform.y = startDataRef.current.y + deltaY;

            const updatedShapes = [...shapes];
            setShapes(updatedShapes);
        } else if (mode === 'resize' && startPointRef.current && startDataRef.current && resizeHandle) {
            handleResize(selectedShape, point, resizeHandle, startDataRef.current);
            const updatedShapes = [...shapes];
            setShapes(updatedShapes);
        } else if (mode === 'rotate' && startPointRef.current && startDataRef.current) {
            handleRotate(selectedShape, point, startDataRef.current);
            const updatedShapes = [...shapes];
            setShapes(updatedShapes);
        } else if (mode === 'editPoints' && editPointIndexRef.current !== null && startPointRef.current && startDataRef.current) {
            const pointIndex = editPointIndexRef.current;
            const points = selectedShape.getControlPoints?.();
            if (points) {
                handleEditPoint(selectedShape, point, pointIndex);
                const updatedShapes = [...shapes];
                setShapes(updatedShapes);
            }
        }
    }, [
        getDeviceCoordinates,
        selectedShapeId,
        shapes,
        mode,
        resizeHandle,
        getHandleAtPoint,
        getPointAtPosition,
        getShapeAtPoint,
        isAddPointMode,
        setAddPointPosition,
    ]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);

        if (mode !== 'idle') {
            addToHistory();
        }

        setMode('idle');
        setResizeHandle(null);
        startPointRef.current = null;
        startDataRef.current = null;
        editPointIndexRef.current = null;
    }, [mode, addToHistory]);

    const handleDoubleClick = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const point = getDeviceCoordinates(e.clientX, e.clientY);
        
        if (!selectedShapeId) return;
        
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) return;

        if (shape.constructor.name === 'PathBezier') {
            const pathBezier = shape as PathBezier;
            
            if (e.ctrlKey || e.metaKey) {
                const pointIndex = getPointAtPosition(shape, point.x, point.y);
                if (pointIndex !== null) {
                    pathBezier.removePoint(pointIndex);
                    const updatedShapes = [...shapes];
                    setShapes(updatedShapes);
                    addToHistoryDirect(updatedShapes, selectedShapeId);
                }
                return;
            }
            
            const localPoint = pathBezier.transformPointToLocal(point.x, point.y);
            if (!localPoint) return;
            
            pathBezier.insertPointNear(localPoint);
            
            const updatedShapes = [...shapes];
            setShapes(updatedShapes);
            addToHistoryDirect(updatedShapes, selectedShapeId);
        }
    }, [selectedShapeId, shapes, getDeviceCoordinates, addToHistoryDirect, getPointAtPosition]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Delete') {
            e.preventDefault();
            deleteSelected();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        } else if (e.key === 'Escape') {
            if (isAddPointMode) {
                toggleAddPointMode();
            }
        }
    }, [deleteSelected, undo, redo, isAddPointMode, toggleAddPointMode]);

    const handleResize = (shape: Shape, point: Point2D, handle: ResizeHandle, startData: ShapeStartData) => {
        if (!startData.width || !startData.height) return;

        const deltaX = point.x - (startPointRef.current?.x || 0);
        const deltaY = point.y - (startPointRef.current?.y || 0);

        let newMinX = startData.x - startData.width / 2;
        let newMinY = startData.y - startData.height / 2;
        let newMaxX = startData.x + startData.width / 2;
        let newMaxY = startData.y + startData.height / 2;

        if (handle === 'nw' || handle === 'n' || handle === 'ne') newMinY += deltaY;
        if (handle === 'se' || handle === 's' || handle === 'sw') newMaxY += deltaY;
        if (handle === 'nw' || handle === 'w' || handle === 'sw') newMinX += deltaX;
        if (handle === 'ne' || handle === 'e' || handle === 'se') newMaxX += deltaX;

        const newWidth = newMaxX - newMinX;
        const newHeight = newMaxY - newMinY;

        if (newWidth < MIN_SIZE) {
            if (handle === 'w' || handle === 'nw' || handle === 'sw') {
                newMinX = newMaxX - MIN_SIZE;
            } else {
                newMaxX = newMinX + MIN_SIZE;
            }
        }
        if (newHeight < MIN_SIZE) {
            if (handle === 'n' || handle === 'nw' || handle === 'ne') {
                newMinY = newMaxY - MIN_SIZE;
            } else {
                newMaxY = newMinY + MIN_SIZE;
            }
        }

        const newScaleX = newWidth / startData.width;
        const newScaleY = newHeight / startData.height;

        shape.transform.scaleX = startData.scaleX * newScaleX;
        shape.transform.scaleY = startData.scaleY * newScaleY;

        shape.transform.x = (newMinX + newMaxX) / 2;
        shape.transform.y = (newMinY + newMaxY) / 2;
    };

    const handleRotate = (shape: Shape, point: Point2D, startData: ShapeStartData) => {
        const bounds = shape.getBounds();
        if (!bounds) return;

        const center = { x: bounds.centerX, y: bounds.centerY };
        const startAngle = Math.atan2((startPointRef.current?.y || 0) - center.y, (startPointRef.current?.x || 0) - center.x);
        const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
        const deltaAngle = currentAngle - startAngle;

        shape.transform.rotation = startData.rotation + deltaAngle;
    };

    const handleEditPoint = (shape: Shape, point: Point2D, pointIndex: number) => {
        const localPoint = shape.transformPointToLocal(point.x, point.y);
        if (!localPoint) return;

        shape.setControlPoint(pointIndex, localPoint);
    };

    const shapesRef = useRef<Shape[]>([]);
    const selectedShapeIdRef = useRef<number | null>(null);
    const hoveredShapeIdRef = useRef<number | null>(null);
    const addPointPositionRef = useRef<Point2D | null>(null);
    const hoveredPointIndexRef = useRef<number | null>(null);

    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);

    useEffect(() => {
        selectedShapeIdRef.current = selectedShapeId;
    }, [selectedShapeId]);

    useEffect(() => {
        hoveredShapeIdRef.current = hoveredShapeId;
    }, [hoveredShapeId]);

    useEffect(() => {
        addPointPositionRef.current = addPointPosition;
    }, [addPointPosition]);

    useEffect(() => {
        hoveredPointIndexRef.current = hoveredPointIndex;
    }, [hoveredPointIndex]);

    // НОВОЕ: Слушаем событие сохранения от Editor.tsx
    useEffect(() => {
        const handleSaveEvent = () => {
            if (onSave) {
                onSave(shapes);
            }
        };

        window.addEventListener("saveProject", handleSaveEvent);
        return () => window.removeEventListener("saveProject", handleSaveEvent);
    }, [onSave, shapes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => {
            renderer.resize();
        });

        if (containerRef.current) {
            ro.observe(containerRef.current);
        } else {
            ro.observe(canvas);
        }

        const frame = () => {
            if (!renderer) return;

            renderer.beginFrame(true);

            for (const shape of shapesRef.current) {
                shape.drawRaster(renderer);
                
                if (shape.id === hoveredShapeIdRef.current && shape.id !== selectedShapeIdRef.current && hoveredShapeIdRef.current !== null) {
                    const bounds = shape.getBounds();
                    if (bounds) {
                        const corners: Point2D[] = [
                            { x: bounds.minX, y: bounds.minY },
                            { x: bounds.maxX, y: bounds.minY },
                            { x: bounds.maxX, y: bounds.maxY },
                            { x: bounds.minX, y: bounds.maxY },
                        ];
                        drawDashedPolygon(renderer, [...corners, corners[0]], { r: 255, g: 200, b: 0, a: 150 }, 1);
                    }
                }
            }

            const selectedShape = selectedShapeIdRef.current ? shapesRef.current.find(s => s.id === selectedShapeIdRef.current) : null;
            if (selectedShape) {
                renderSelectionUI(renderer, selectedShape);
            }

            renderer.commit();
            rafRef.current = requestAnimationFrame(frame);
        };

        rafRef.current = requestAnimationFrame(frame);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            ro.disconnect();
            renderer.dispose();
        };
    }, []);

    const renderSelectionUI = (renderer: RasterRenderer, shape: Shape) => {
        const bounds = shape.getBounds();
        if (!bounds) return;

        const corners: Point2D[] = [
            { x: bounds.minX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.maxY },
            { x: bounds.minX, y: bounds.maxY },
        ];

        drawDashedPolygon(renderer, [...corners, corners[0]], { r: 0, g: 100, b: 200, a: 255 }, 2);

        const handles = getShapeBoundsCorners(shape);
        if (handles) {
            for (const handle of handles) {
                drawHandle(renderer, handle, false);
            }
        }

        const topMid = getShapeBoundsCorners(shape)?.[1];
        if (topMid) {
            const center = { x: bounds.centerX, y: bounds.centerY };
            const dir = Math.atan2(topMid.y - center.y, topMid.x - center.x);
            const rotHandleX = center.x + Math.cos(dir) * ROTATION_HANDLE_DISTANCE;
            const rotHandleY = center.y + Math.sin(dir) * ROTATION_HANDLE_DISTANCE;
            drawHandle(renderer, { x: rotHandleX, y: rotHandleY }, true);
        }

        const controlPoints = shape.getControlPoints?.();
        if (controlPoints) {
            for (let i = 0; i < controlPoints.length; i++) {
                const devicePoint = shape.transformPointToDevice(controlPoints[i].x, controlPoints[i].y);
                const isHovered = hoveredPointIndexRef.current === i;
                drawControlPoint(renderer, devicePoint, isHovered);
            }
        }

        if (shape.constructor.name === 'PathBezier' && addPointPositionRef.current) {
            drawAddPointPreview(renderer, addPointPositionRef.current);
        }
    };

    const drawHandle = (renderer: RasterRenderer, pos: Point2D, isRotation: boolean) => {
        const color = isRotation ? { r: 255, g: 150, b: 0, a: 255 } : { r: 0, g: 150, b: 255, a: 255 };
        const size = HANDLE_SIZE;

        const corners = [
            { x: pos.x - size / 2, y: pos.y - size / 2 },
            { x: pos.x + size / 2, y: pos.y - size / 2 },
            { x: pos.x + size / 2, y: pos.y + size / 2 },
            { x: pos.x - size / 2, y: pos.y + size / 2 },
        ];

        renderer.fillPolygon(corners, color);
        renderer.strokePolygon(corners, { r: 255, g: 255, b: 255, a: 255 }, 1);
    };

    const drawControlPoint = (renderer: RasterRenderer, pos: Point2D, isHovered: boolean) => {
        const radius = isHovered ? 6 : 4;
        const color = isHovered ? { r: 255, g: 200, b: 0, a: 255 } : { r: 150, g: 150, b: 255, a: 255 };

        const steps = 12;
        const points: Point2D[] = [];
        for (let i = 0; i < steps; i++) {
            const theta = (i / steps) * 2 * Math.PI;
            points.push({
                x: pos.x + radius * Math.cos(theta),
                y: pos.y + radius * Math.sin(theta),
            });
        }

        renderer.fillPolygon(points, color);
    };

    const drawAddPointPreview = (renderer: RasterRenderer, pos: Point2D) => {
        const radius = 8;
        const color = { r: 0, g: 255, b: 100, a: 200 };

        const steps = 12;
        const points: Point2D[] = [];
        for (let i = 0; i < steps; i++) {
            const theta = (i / steps) * 2 * Math.PI;
            points.push({
                x: pos.x + radius * Math.cos(theta),
                y: pos.y + radius * Math.sin(theta),
            });
        }

        renderer.fillPolygon(points, color);
        renderer.strokePolygon(points, { r: 255, g: 255, b: 255, a: 255 }, 1);
    };

    const drawDashedPolygon = (renderer: RasterRenderer, points: Point2D[], color: any, width: number) => {
        const dashLength = 5;
        const gapLength = 3;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.hypot(dx, dy);
            const steps = Math.ceil(length / (dashLength + gapLength));

            for (let j = 0; j < steps; j++) {
                const t1 = (j * (dashLength + gapLength)) / length;
                const t2 = Math.min((j * (dashLength + gapLength) + dashLength) / length, 1);

                const x1 = p1.x + dx * t1;
                const y1 = p1.y + dy * t1;
                const x2 = p1.x + dx * t2;
                const y2 = p1.y + dy * t2;

                renderer.strokeLine(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2), color, width);
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cursor = 'default';
        if (isAddPointMode) {
            cursor = 'crosshair';
        } else if (hoveredHandle && hoveredHandle !== 'rotate') {
            const cursorMap: Record<string, string> = {
                nw: 'nwse-resize',
                n: 'ns-resize',
                ne: 'nesw-resize',
                e: 'ew-resize',
                se: 'nwse-resize',
                s: 'ns-resize',
                sw: 'nesw-resize',
                w: 'ew-resize',
            };
            cursor = cursorMap[hoveredHandle] || 'default';
        } else if (hoveredHandle === 'rotate') {
            cursor = 'grab';
        } else if (hoveredPointIndex !== null) {
            cursor = 'crosshair';
        }

        canvas.style.cursor = cursor;
    }, [hoveredHandle, hoveredPointIndex, isAddPointMode]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="flex flex-col gap-4 w-full h-full bg-slate-900 text-white">
            <div className="flex gap-2 p-2 bg-slate-800 border-b border-slate-700 flex-wrap">
                <button
                    onClick={createRectangle}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Прямоугольник
                </button>
                <button
                    onClick={createEllipse}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Эллипс
                </button>
                <button
                    onClick={createTriangle}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Треугольник
                </button>
                <div className="flex-1" />
                <span className="text-gray-400 text-sm px-2 self-center">Кривые:</span>
                <button
                    onClick={createBezierCurve}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Catmull-Rom
                </button>
                <button
                    onClick={createQuadraticBezier}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Квадратичная
                </button>
                <button
                    onClick={createCubicBezier}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Кубическая
                </button>
                <button
                    onClick={createLine}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                    Линия
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => undo()}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                >
                    Назад
                </button>
                <button
                    onClick={() => redo()}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                >
                    Вперёд
                </button>
                <button
                    onClick={deleteSelected}
                    disabled={selectedShapeId === null}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm disabled:opacity-50"
                >
                    Удалить
                </button>
                <button
                    onClick={() => toggleCurveClosed()}
                    disabled={selectedShapeId === null || !isCurveSelected()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm disabled:opacity-50"
                >
                    Замкнуть/Разомкнуть
                </button>
                <button
                    onClick={toggleAddPointMode}
                    disabled={selectedShapeId === null || (shapes.find(s => s.id === selectedShapeId)?.constructor.name ?? '') !== 'PathBezier'}
                    className={`px-3 py-1 rounded text-sm disabled:opacity-50 ${
                        isAddPointMode ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    Добавить точку
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-2 p-2">
                <div ref={containerRef} className="flex-1 bg-black border border-slate-700 rounded overflow-hidden relative" style={{ minHeight: '300px' }}>
                    <canvas
                        ref={canvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onDoubleClick={handleDoubleClick}
                        style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                        }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-3 py-1 rounded text-xs text-gray-300 font-mono">
                        X: {Math.round(cursorPos.x)}, Y: {Math.round(cursorPos.y)}
                    </div>
                </div>

                <aside className="w-64 bg-slate-800 border border-slate-700 rounded p-3 overflow-y-auto">
                    <h3 className="font-bold mb-2">Слои</h3>
                    {shapes.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет фигур</p>
                    ) : (
                        <ul className="space-y-1">
                            {[...shapes].reverse().map((shape) => (
                                <li
                                    key={shape.id}
                                    className={`p-2 rounded text-sm cursor-pointer flex items-center justify-between ${
                                        selectedShapeId === shape.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                                    }`}
                                    onClick={() => setSelectedShapeId(shape.id)}
                                >
                                    <span>{shape.constructor.name} #{shape.id}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveShapeBackward(shape.id);
                                            }}
                                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs rounded"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveShapeForward(shape.id);
                                            }}
                                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs rounded"
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
}