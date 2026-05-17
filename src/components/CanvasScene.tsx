import { useEffect, useRef } from "react";
import { LineAlg, RasterRenderer } from "../lib/raster/RasterRender";
import { Rect } from "../lib/shape/subClasses/Rect";
import { Line } from "../lib/shape/subClasses/Line";
import { Oval } from "../lib/shape/subClasses/Oval";

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const shapesRef = useRef<any[]>([]);

    useEffect(() => {
        const rect1 = new Rect(150, 150);
        rect1.transform.x = 300;
        rect1.transform.y = 250;
        rect1.transform.rotation = Math.PI / 5;
        rect1.fillStyle = "#ff6b6b";
        rect1.fillOpacity = 0.85;
        rect1.strokeStyle = "#ffffff";
        rect1.strokeWidth = 3;

        const rect2 = new Rect(100, 200);
        rect2.transform.x = 600;
        rect2.transform.y = 400;
        rect2.transform.rotation = -Math.PI / 6;
        rect2.fillStyle = "#4ecdc4";
        rect2.fillOpacity = 0.7;
        rect2.strokeStyle = "#ffe66d";
        rect2.strokeWidth = 2;

        const line1 = new Line(0, 0, 250, 0);
        line1.transform.x = 150;
        line1.transform.y = 550;
        line1.transform.rotation = Math.PI / 3;
        line1.strokeStyle = "#ff9f1c";
        line1.strokeWidth = 4;

        const line2 = new Line(0, 0, 350, 0);
        line2.transform.x = 750;
        line2.transform.y = 600;
        line2.transform.rotation = -Math.PI / 5;
        line2.strokeStyle = "#2ec4b6";
        line2.strokeWidth = 3;

        const oval1 = new Oval(120, 80);
        oval1.transform.x = 500;
        oval1.transform.y = 150;
        oval1.fillStyle = "#e71d36";
        oval1.fillOpacity = 0.6;
        oval1.strokeStyle = "#ff9f1c";
        oval1.strokeWidth = 2;

        const oval2 = new Oval(90, 130);
        oval2.transform.x = 200;
        oval2.transform.y = 700;
        oval2.fillStyle = "#a8e6cf";
        oval2.fillOpacity = 0.75;
        oval2.strokeStyle = "#3b3b3b";
        oval2.strokeWidth = 2;

        const circle = new Oval(70, 70);
        circle.transform.x = 850;
        circle.transform.y = 300;
        circle.fillStyle = "#f4a261";
        circle.fillOpacity = 0.9;
        circle.strokeStyle = "#e76f51";
        circle.strokeWidth = 2;

        shapesRef.current = [rect1, rect2, line1, line2, oval1, oval2, circle];
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
                background: '#1a1a2e'
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