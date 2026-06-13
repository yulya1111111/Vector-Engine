import { test, expect } from "vitest";
import { QuadraticBezier } from "../subClasses/QuadraticBezier.ts";
import { CubicBezier } from "../subClasses/CubicBezier.ts";
import { PathBezier } from "../subClasses/PathBezier.ts";


// ==========================================
// QUADRATIC BEZIER TESTS (БЕЗ АРГУМЕНТОВ)
// ==========================================

test("QuadraticBezier: HitTest - Point on curve", () => {
    const qb = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    qb.strokeWidth = 4;
    expect(qb.hitTest(0, 0)).toBe(true);
    expect(qb.hitTest(100, 0)).toBe(true);
});

test("QuadraticBezier: HitTest - Point outside", () => {
    const qb = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    expect(qb.hitTest(-10, 0)).toBe(false);
});

// ==========================================
// CUBIC BEZIER TESTS (БЕЗ АРГУМЕНТОВ)
// ==========================================

test("CubicBezier: HitTest - Point on curve", () => {
    const cb = new CubicBezier(0, 0, 0, 100, 100, 100, 100, 0);
    cb.strokeWidth = 4;
    expect(cb.hitTest(0, 0)).toBe(true);
    expect(cb.hitTest(100, 0)).toBe(true);
});

test("CubicBezier: HitTest - Point outside", () => {
    const cb = new CubicBezier(0, 0, 0, 100, 100, 100, 100, 0);
    expect(cb.hitTest(50, 120)).toBe(false);
});

// ==========================================
// PATHBEZIER TESTS (БЕЗ АРГУМЕНТОВ)
// ==========================================

test("PathBezier: Polyline - все точки отрисовываются (баг исправлен)", () => {
    const path = new PathBezier('polyline', false);
    path.addPoint({ x: 0, y: 0 });
    path.addPoint({ x: 100, y: 0 });
    path.addPoint({ x: 100, y: 100 });
    
    const points = path.flattenDevicePoints(1);
    expect(points.length).toBe(3);
});

test("PathBezier: Points can be added and removed", () => {
    const path = new PathBezier('polyline', false);
    path.addPoint({ x: 0, y: 0 });
    path.addPoint({ x: 100, y: 0 });
    expect(path.getControlPoints().length).toBe(2);
    
    path.addPoint({ x: 100, y: 100 });
    expect(path.getControlPoints().length).toBe(3);
    
    path.removePoint(1);
    expect(path.getControlPoints().length).toBe(2);
});