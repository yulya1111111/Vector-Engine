import { useEffect, useRef } from "react";
import { LineAlg, RasterRenderer } from "../lib/raster/RasterRender"; // Проверь путь, у тебя было .ts, но в импортах React обычно без расширения или .tsx/.ts
import { Rect } from "../lib/shape/subClasses/Rect";
import { Line } from "../lib/shape/subClasses/Line";
import { Oval } from "../lib/shape/subClasses/Oval";
// import { Triangle } from "../lib/shape/subClasses/Triangle"; // Если нужно

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Храним фигуры в рефе, чтобы не пересоздавать их при каждом рендере React
    const shapesRef = useRef<any[]>([]);

    // Инициализация фигур (выполняется один раз при монтировании)
    useEffect(() => {
        const rect = new Rect(200, 100);
        rect.transform.x = 400;
        rect.transform.y = 300;
        rect.transform.rotation = Math.PI / 6; // 30 градусов
        rect.fillStyle = "#0088ff";
        rect.fillOpacity = 0.8;
        rect.strokeStyle = "#000000";
        rect.strokeWidth = 2;

        const line = new Line(0, 0, 300, 0);
        line.transform.x = 100;
        line.transform.y = 500;
        line.transform.rotation = -Math.PI / 4;
        line.strokeStyle = "#00ff00";
        line.strokeWidth = 5;

        const oval = new Oval(80, 50);
        oval.transform.x = 700;
        oval.transform.y = 200;
        oval.fillStyle = "#ff0000";
        oval.fillOpacity = 0.5;
        oval.strokeStyle = "#ffffff";
        oval.strokeWidth = 2;

        // Сохраняем фигуры в реф
        shapesRef.current = [rect, line, oval];
    }, []);

    useEffect(() =>
    {
        if (rendererRef.current)
        {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => 
    {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => 
        {
            renderer.resize();
        });

        if (containerRef.current) 
        {
            ro.observe(containerRef.current);
        } else {
            ro.observe(canvas);
        }

        let rafId: number;

        const frame = () =>
        {
            const r = rendererRef.current;
            
            if (r) 
            {
                r.beginFrame(true); // Очистка буфера

                // Отрисовка всех фигур из рефа
                for (const shape of shapesRef.current) 
                {
                    shape.drawRaster(r);
                }

                r.commit(); // Вывод на экран
            }
            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);

        return () => 
        {
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
                background: '#000' // Черный фон, чтобы видеть прозрачность
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