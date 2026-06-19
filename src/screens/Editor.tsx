﻿import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { useParams } from "react-router-dom";
import EditorCanvas from "../components/EditorCanvas.tsx";
import { Shape } from "../lib/shape/Shape.ts";
import { saveProject, loadProject } from "../lib/projectStorage.ts";
import { shapeFromJSON } from "../lib/shape/shapeFromJSON.ts";

const Editor = () => {
    const { id } = useParams<{ id: string }>();
    const [initialShapes, setInitialShapes] = useState<Shape[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string>("");

    // Автозагрузка проекта при открытии
    useEffect(() => {
        if (!id) return;

        const loadSavedProject = async () => {
            try {
                const data = await loadProject(Number(id));
                if (data && data.shapes) {
                    // Восстанавливаем фигуры из JSON
                    const restoredShapes = data.shapes
                        .map(shapeFromJSON)
                        .filter((s): s is Shape => s !== null);
                    setInitialShapes(restoredShapes);
                    console.log(`Проект №${id} загружен (${restoredShapes.length} фигур)`);
                } else {
                    console.log(`Проект №${id} не найден — открывается пустой`);
                }
            } catch (error) {
                console.error("Ошибка загрузки проекта:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadSavedProject();
    }, [id]);

    // Обработчик сохранения
    const handleSave = useCallback(async (currentShapes: Shape[]) => {
        if (!id) return;

        try {
            const projectData = {
                id: Number(id),
                name: `Проект №${id}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shapes: currentShapes.map(s => s.toJSON()),
            };

            await saveProject(projectData);
            setSaveStatus("Сохранено!");
            console.log(`Проект №${id} сохранён (${currentShapes.length} фигур)`);

            // Убираем надпись через 2 секунды
            setTimeout(() => setSaveStatus(""), 2000);
        } catch (error) {
            setSaveStatus("Ошибка сохранения");
            console.error("Ошибка сохранения:", error);
        }
    }, [id]);

    if (!id) return <div />;

    return (
        <motion.div className="h-screen w-screen overflow-hidden flex flex-col text-white">
            
            <header className="h-14 border-b bg-slate-900 px-4 shrink-0 flex items-center justify-between">
                <h1 className="font-bold">Редактирование проекта №{id}</h1>
                
                <div className="flex items-center gap-3">
                    {saveStatus && (
                        <span className="text-sm text-green-400">{saveStatus}</span>
                    )}
                    <button
                        onClick={() => {
                            // Запросим сохранение через EditorCanvas
                            window.dispatchEvent(new CustomEvent("saveProject"));
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                    >
                        Сохранить
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden" style={{ width: '100%', height: '100%' }}>
                {isLoaded ? (
                    <EditorCanvas 
                        initialShapes={initialShapes} 
                        onSave={handleSave} 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Загрузка проекта...
                    </div>
                )}
            </main>
        </motion.div>
    );
};

export default Editor;