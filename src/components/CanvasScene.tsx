import { useEffect, useRef } from "react";
import { LineAlg, RasterRenderer } from "../lib/raster/RasterRender";

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
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
                
                const triangle = [
                    { x: 150, y: 100 },
                    { x: 250, y: 100 },
                    { x: 200, y: 200 }
                ];
                const cyan = { r: 0, g: 255, b: 255, a: 200 };
                r.fillPolygon(triangle, cyan);
                
                const pentagon = [];
                const pentagonCenter = { x: 400, y: 150 };
                const pentagonRadius = 60;
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    pentagon.push({
                        x: pentagonCenter.x + pentagonRadius * Math.cos(angle),
                        y: pentagonCenter.y + pentagonRadius * Math.sin(angle)
                    });
                }
                const magenta = { r: 255, g: 0, b: 255, a: 255 };
                r.strokePolygon(pentagon, magenta, 3);
                
                const star = [];
                const starCenter = { x: 600, y: 120 };
                const outerR = 50, innerR = 20;
                for (let i = 0; i < 10; i++) {
                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                    const radius = i % 2 === 0 ? outerR : innerR;
                    star.push({
                        x: starCenter.x + radius * Math.cos(angle),
                        y: starCenter.y + radius * Math.sin(angle)
                    });
                }
                const gold = { r: 255, g: 215, b: 0, a: 220 };
                r.fillPolygon(star, gold);
                
                const ellipse: { x: number; y: number }[] = [];
                const ellipseCenter = { x: 150, y: 350 };
                const rx = 70, ry = 40;
                for (let i = 0; i <= 32; i++) {
                    const angle = (i / 32) * 2 * Math.PI;
                    ellipse.push({
                        x: ellipseCenter.x + rx * Math.cos(angle),
                        y: ellipseCenter.y + ry * Math.sin(angle)
                    });
                }
                const purple = { r: 180, g: 100, b: 255, a: 180 };
                r.fillPolygon(ellipse, purple);
                
                const redTransparent = { r: 255, g: 50, b: 50, a: 120 };
                r.fillCircle(400, 350, 70, redTransparent);
                
                const rect = [
                    { x: 0, y: 300 },
                    { x: 850, y: 300 },
                    { x: 0, y: 400 },
                    { x: 700, y: 400 }
                ];
                const darkBlue = { r: 30, g: 60, b: 120, a: 200 };
                const white = { r: 255, g: 255, b: 255, a: 255 };
                r.fillPolygon(rect, darkBlue);
                r.strokePolygon(rect, white, 2);
            
        

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
                background: '#0a0a12'
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