import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { loadProjectIndex } from "../lib/projectStorage";

interface GalleryProject {
    id: number;
    name: string;
    date: string;
}

const Gallery = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<GalleryProject[]>([]);
    const nextIdRef = useRef<number>(1);

    // Загрузка списка проектов из файловой системы при открытии
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const index = await loadProjectIndex();
                
                // Находим максимальный ID для создания новых проектов
                if (index.length > 0) {
                    const maxId = Math.max(...index.map(p => p.id));
                    nextIdRef.current = maxId + 1;
                }
                
                // Преобразуем в формат для отображения
                const formatted: GalleryProject[] = index.map(p => ({
                    id: p.id,
                    name: p.name,
                    date: new Date(p.updatedAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                }));
                
                setProjects(formatted);
                console.log(`Загружено ${formatted.length} проектов`);
            } catch (error) {
                console.error("Ошибка загрузки списка проектов:", error);
            }
        };

        loadProjects();
    }, []);

    // Создание нового проекта
    const handleCreateProject = () => {
        const newId = nextIdRef.current;
        nextIdRef.current += 1;
        navigate(`/editor/${newId}`);
    };

    // Открытие существующего проекта
    const handleOpenProject = (id: number) => {
        navigate(`/editor/${id}`);
    };

    return (
        <motion.div 
            className="min-h-screen w-full bg-slate-950 text-white p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">Галерея проектов</h1>
                    <button
                        onClick={handleCreateProject}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                        + Новый проект
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg mb-4">Пока нет сохранённых проектов</p>
                        <p className="text-slate-500 text-sm">
                            Нажмите «Новый проект», чтобы создать первый
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03 }}
                                className="bg-slate-900 border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors"
                                onClick={() => handleOpenProject(project.id)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">{project.name}</h3>
                                    <span className="text-xs text-slate-500">#{project.id}</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-4">
                                    Обновлено: {project.date}
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenProject(project.id);
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                                >
                                    Открыть
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Gallery;