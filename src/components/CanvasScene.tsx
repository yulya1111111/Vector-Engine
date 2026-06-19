import { useEffect, useRef } from "react";
import { LineAlg, RasterRenderer } from "../lib/raster/RasterRender";
import { Rect } from "../lib/shape/subClasses/Rect";
import { Line } from "../lib/shape/subClasses/Line";
import { Oval } from "../lib/shape/subClasses/Oval";
import { Triangle } from "../lib/shape/subClasses/Triangle";
import { QuadraticBezier } from "../lib/shape/subClasses/QuadraticBezier";
import { CubicBezier } from "../lib/shape/subClasses/CubicBezier";
import { PathBezier } from "../lib/shape/subClasses/PathBezier";

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const shapesRef = useRef<any[]>([]);

    useEffect(() => {
        
        const rect = new Rect(200, 100);
        rect.transform.x = 120;
        rect.transform.y = 100;
        rect.transform.rotation = Math.PI / 6;
        rect.fillStyle = "#00ff59";
        rect.fillOpacity = 0.7;
        rect.strokeStyle = "#000000";
        rect.strokeWidth = 0;

        const line = new Line(0, 0, 300, 0);
        line.transform.x = 100;
        line.transform.y = 280;
        line.transform.rotation = -Math.PI / 4;
        line.strokeStyle = "#00ff00";
        line.strokeWidth = 5;

        const oval = new Oval(80, 50);
        oval.transform.x = 450;
        oval.transform.y = 120;
        oval.fillStyle = "#ff0000";
        oval.fillOpacity = 0.5;
        oval.strokeStyle = "#43fedb";
        oval.strokeWidth = 4;

        const triangle = new Triangle(150, 120);
        triangle.transform.x = 420;
        triangle.transform.y = 260;
        triangle.transform.rotation = Math.PI / 8;
        triangle.fillStyle = "#00ffaa";
        triangle.fillOpacity = 0.7;
        triangle.strokeStyle = "#ffffff";
        triangle.strokeWidth = 3;

        const quadBezier1 = new QuadraticBezier(0, 0, 60, -50, 120, 0);
        quadBezier1.transform.x = 100;
        quadBezier1.transform.y = 400;
        quadBezier1.strokeStyle = "#ffaa00";
        quadBezier1.strokeWidth = 4;
        quadBezier1.strokeOpacity = 1;
        quadBezier1.fillOpacity = 0;

        const cubicBezier1 = new CubicBezier(0, 0, 40, -60, 80, 60, 120, 0);
        cubicBezier1.transform.x = 300;
        cubicBezier1.transform.y = 400;
        cubicBezier1.strokeStyle = "#ff0000";
        cubicBezier1.strokeWidth = 4;
        cubicBezier1.strokeOpacity = 1;
        cubicBezier1.fillOpacity = 0;

        const cubicBezier2 = new CubicBezier(0, 0, 50, -70, 70, 70, 120, 0);
        cubicBezier2.transform.x = 500;
        cubicBezier2.transform.y = 400;
        cubicBezier2.strokeStyle = "#00aaff";
        cubicBezier2.strokeWidth = 4;
        cubicBezier2.strokeOpacity = 1;
        cubicBezier2.fillOpacity = 0;

        const polyline = new PathBezier('polyline', false);
        polyline.addPointLocal(0, 40);
        polyline.addPointLocal(30, 10);
        polyline.addPointLocal(60, 50);
        polyline.addPointLocal(90, 20);
        polyline.addPointLocal(120, 60);
        polyline.transform.x = 700;
        polyline.transform.y = 100;
        polyline.strokeStyle = "#00ff00";
        polyline.strokeWidth = 3;
        polyline.strokeOpacity = 1;
        polyline.fillOpacity = 0;

        const closedPoly = new PathBezier('polyline', true);
        closedPoly.addPointLocal(0, 30);
        closedPoly.addPointLocal(35, 0);
        closedPoly.addPointLocal(70, 30);
        closedPoly.addPointLocal(52, 70);
        closedPoly.addPointLocal(18, 70);
        closedPoly.transform.x = 700;
        closedPoly.transform.y = 220;
        closedPoly.fillStyle = "#aa00ff";
        closedPoly.fillOpacity = 0.6;
        closedPoly.strokeStyle = "#ffffff";
        closedPoly.strokeWidth = 2;

        const bezierPath = new PathBezier('catmull', false);
        bezierPath.addPointLocal(0, 40);
        bezierPath.addPointLocal(40, 10);
        bezierPath.addPointLocal(80, 70);
        bezierPath.addPointLocal(120, 30);
        bezierPath.transform.x = 100;
        bezierPath.transform.y = 520;
        bezierPath.strokeStyle = "#ff0000";
        bezierPath.strokeWidth = 3;
        bezierPath.strokeOpacity = 1;
        bezierPath.fillOpacity = 0;

        const catmullOpen = new PathBezier('catmull', true);
        catmullOpen.addPointLocal(0, 40);
        catmullOpen.addPointLocal(40, 10);
        catmullOpen.addPointLocal(80, 70);
        catmullOpen.addPointLocal(120, 30);
        catmullOpen.addPointLocal(160, 50);
        catmullOpen.transform.x = 350;
        catmullOpen.transform.y = 520;
        catmullOpen.strokeStyle = "#e1ff00";
        catmullOpen.strokeWidth = 3;
        catmullOpen.strokeOpacity = 1;
        catmullOpen.fillOpacity = 0;

        const catmullClosed = new PathBezier('catmull', true);
        catmullClosed.addPointLocal(0, 30);
        catmullClosed.addPointLocal(30, 0);
        catmullClosed.addPointLocal(60, 35);
        catmullClosed.addPointLocal(45, 70);
        catmullClosed.addPointLocal(15, 65);
        catmullClosed.transform.x = 650;
        catmullClosed.transform.y = 520;
        catmullClosed.fillStyle = "#ff0066";
        catmullClosed.fillOpacity = 0.5;
        catmullClosed.strokeStyle = "#ffffff";
        catmullClosed.strokeWidth = 2;

        shapesRef.current = [
            rect,
            line, 
            oval,
            triangle,
            quadBezier1,
            cubicBezier1, cubicBezier2,
            polyline, closedPoly, bezierPath, catmullOpen, catmullClosed
        ];
    }, []);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => {
            renderer.resize();
        });

        if (containerRef.current) {
            ro.observe(containerRef.current);
        } else {
            ro.observe(canvas);
        }

        let rafId: number;

        const frame = () => {
            const r = rendererRef.current;
            
            if (r) {
                r.beginFrame(true);

                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }

                r.commit();
            }
            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: '#fff'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%'
                }}
            />
        </div>
    );
}