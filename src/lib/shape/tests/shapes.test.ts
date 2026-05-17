import { test, expect } from "vitest";
import { Rect } from "../subClasses/Rect.ts";
import { Line } from "../subClasses/Line.ts";
import { Oval } from "../subClasses/Oval.ts";

// ==========================================
// RECT TESTS
// ==========================================

test("Rect: Local bounds should be centered at origin", () => {
    const w = 100;
    const h = 60;
    const rect = new Rect(w, h);

    const localBounds = rect.getLocalBounds();
    expect(localBounds).not.toBeNull();

    if (localBounds) {
        expect(localBounds.minX).toBeCloseTo(-w / 2);
        expect(localBounds.maxX).toBeCloseTo(w / 2);
        expect(localBounds.minY).toBeCloseTo(-h / 2);
        expect(localBounds.maxY).toBeCloseTo(h / 2);
    }
});

test("Rect: Device bounds reflect translation and scale", () => {
    const rect = new Rect(40, 20); // Local W=40, H=20 -> HalfW=20, HalfH=10

    // Transform: Move to (100, 50), Scale x2, y2
    rect.transform.x = 100;
    rect.transform.y = 50;
    rect.transform.scaleX = 2;
    rect.transform.scaleY = 2;
    rect.transform.rotation = 0;

    const deviceBounds = rect.getBounds();
    expect(deviceBounds).not.toBeNull();

    if (deviceBounds) {
        // Local [-20, 20] scaled by 2 -> [-40, 40]. Translated by 100 -> [60, 140]
        expect(deviceBounds.minX).toBeCloseTo(60);
        expect(deviceBounds.maxX).toBeCloseTo(140);

        // Local [-10, 10] scaled by 2 -> [-20, 20]. Translated by 50 -> [30, 70]
        expect(deviceBounds.minY).toBeCloseTo(30);
        expect(deviceBounds.maxY).toBeCloseTo(70);
    }
});

test("Rect: HitTest - Point inside", () => {
    const rect = new Rect(100, 50);
    rect.transform.x = 0;
    rect.transform.y = 0;
    rect.transform.rotation = 0;

    // Center
    expect(rect.hitTest(0, 0)).toBe(true);
    // Inside quadrant
    expect(rect.hitTest(20, 10)).toBe(true);
    // Edge case (boundary is inclusive in typical math checks, let's assume <=)
    expect(rect.hitTest(50, 0)).toBe(true);
    expect(rect.hitTest(0, 25)).toBe(true);
});

test("Rect: HitTest - Point outside", () => {
    const rect = new Rect(100, 50);
    rect.transform.x = 0;
    rect.transform.y = 0;
    rect.transform.rotation = 0;

    // Just outside X
    expect(rect.hitTest(51, 0)).toBe(false);
    // Just outside Y
    expect(rect.hitTest(0, 26)).toBe(false);
    // Far away
    expect(rect.hitTest(100, 100)).toBe(false);
});

test("Rect: HitTest - With Rotation", () => {
    const rect = new Rect(100, 10); // Thin horizontal bar
    rect.transform.x = 0;
    rect.transform.y = 0;
    rect.transform.rotation = Math.PI / 2; // Rotate 90 deg -> Vertical bar

    // Local coords: X[-50, 50], Y[-5, 5]
    // Rotated 90 deg: Device X corresponds to Local -Y, Device Y corresponds to Local X.
    // So Device X range is [-5, 5], Device Y range is [-50, 50].

    // Point (0, 40) -> Local (40, 0). Is 40 in [-50, 50]? Yes. Is 0 in [-5, 5]? Yes. Inside.
    expect(rect.hitTest(0, 40)).toBe(true);

    // Point (10, 0) -> Local (0, -10). Is 0 in [-50, 50]? Yes. Is -10 in [-5, 5]? No. Outside.
    expect(rect.hitTest(10, 0)).toBe(false);
});


// ==========================================
// LINE TESTS
// ==========================================

test("Line: Local bounds cover endpoints relative to center", () => {
    // Line from (0,0) to (100,0). Center (50,0).
    // Local p1: (-50, 0), Local p2: (50, 0).
    const line = new Line(0, 0, 100, 0);

    const localBounds = line.getLocalBounds();
    expect(localBounds).not.toBeNull();

    if (localBounds) {
        expect(localBounds.minX).toBeCloseTo(-50);
        expect(localBounds.maxX).toBeCloseTo(50);
        expect(localBounds.minY).toBeCloseTo(0);
        expect(localBounds.maxY).toBeCloseTo(0);
    }
});

test("Line: HitTest - Diagonal line", () => {
    const line = new Line(0, 0, 100, 100);

    // Проверим, что центр действительно в (50,50)
    expect(line.transform.x).toBeCloseTo(50);
    expect(line.transform.y).toBeCloseTo(50);
    
    expect(line.hitTest(50, 50)).toBe(true);
    
    expect(line.hitTest(100, 100)).toBe(true);
    
    expect(line.hitTest(0, 0)).toBe(true);
    
    expect(line.hitTest(50, 52)).toBe(false);
});

test("Line: HitTest - Distance to segment", () => {
    const line = new Line(0, 0, 100, 0);
    line.strokeWidth = 10; // Radius threshold = 5
    
    expect(line.hitTest(50, 0)).toBe(true);
    
    expect(line.hitTest(50, 4)).toBe(true);
    
    expect(line.hitTest(50, 6)).toBe(false);
    
    expect(line.hitTest(102, 0)).toBe(true);
    
    expect(line.hitTest(102, 10)).toBe(false);
    
    expect(line.hitTest(-2, 0)).toBe(true);
});

test("Line: HitTest - Diagonal line (Default Transform)", () => {

    const line = new Line(0, 0, 100, 100);

    // Проверим, что центр действительно в (50,50)
    expect(line.transform.x).toBeCloseTo(50);
    expect(line.transform.y).toBeCloseTo(50);
    
    expect(line.hitTest(50, 50)).toBe(true);

    expect(line.hitTest(100, 100)).toBe(true);

    expect(line.hitTest(0, 0)).toBe(true);

    expect(line.hitTest(50, 52)).toBe(false);
});


// ==========================================
// OVAL TESTS
// ==========================================

test("Oval: Local bounds are radii", () => {
    const oval = new Oval(50, 30);
    
    const localBounds = oval.getLocalBounds();

    expect(localBounds).not.toBeNull();
    
    if (localBounds) {
        expect(localBounds.minX).toBeCloseTo(-50);
        expect(localBounds.maxX).toBeCloseTo(50);
        expect(localBounds.minY).toBeCloseTo(-30);
        expect(localBounds.maxY).toBeCloseTo(30);
    }
});

test("Oval: HitTest - Standard ellipse equation", () => {
    const oval = new Oval(100, 50);
    oval.transform.x = 0;
    oval.transform.y = 0;
    oval.transform.rotation = 0;

    // Center
    expect(oval.hitTest(0, 0)).toBe(true);

    // On boundary X (100, 0): (100/100)^2 + 0 = 1. True.
    expect(oval.hitTest(100, 0)).toBe(true);

    // On boundary Y (0, 50): 0 + (50/50)^2 = 1. True.
    expect(oval.hitTest(0, 50)).toBe(true);

    // Inside (50, 25): (0.5)^2 + (0.5)^2 = 0.5 <= 1. True.
    expect(oval.hitTest(50, 25)).toBe(true);

    // Outside (101, 0): > 1. False.
    expect(oval.hitTest(101, 0)).toBe(false);

    // Outside (0, 51): > 1. False.
    expect(oval.hitTest(0, 51)).toBe(false);
});

test("Oval: HitTest - With Scale", () => {
    const oval = new Oval(50, 50); // Circle r=50
    oval.transform.scaleX = 2; // Effectively rx=100 in device space
    oval.transform.scaleY = 1; // ry=50 in device space

    // Point (100, 0) in device.
    // Inverse transform: x_local = 100 / 2 = 50. y_local = 0.
    // Check: (50/50)^2 + 0 = 1. True.
    expect(oval.hitTest(100, 0)).toBe(true);

    // Point (101, 0) -> x_local = 50.5.
    // Check: (50.5/50)^2 > 1. False.
    expect(oval.hitTest(101, 0)).toBe(false);
});

test("Oval: HitTest - With Rotation", () => {
    const oval = new Oval(100, 50);
    oval.transform.rotation = Math.PI / 2; // Rotate 90 deg. Major axis becomes Y.

    // Originally major axis along X (length 200). After rotation, major axis along Y (length 200).
    // Minor axis along Y (length 100). After rotation, minor axis along X (length 100).

    // Point (0, 90) is on major axis (Y). Should be inside (radius 100).
    expect(oval.hitTest(0, 90)).toBe(true);

    // Point (0, 101) is outside major axis.
    expect(oval.hitTest(0, 101)).toBe(false);

    // Point (40, 0) is on minor axis (X). Should be inside (radius 50).
    expect(oval.hitTest(40, 0)).toBe(true);

    // Point (51, 0) is outside minor axis.
    expect(oval.hitTest(51, 0)).toBe(false);
});