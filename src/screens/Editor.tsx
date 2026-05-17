import { motion } from "motion/react";
import { useParams } from "react-router-dom";
import CanvasScene from "../components/CanvasScene.tsx";

const Editor = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) return <div />;

    return (
        <motion.div className="h-screen w-screen overflow-hidden flex flex-col text-white">
            
            <header className="h-14 border-b bg-slate-900 px-4 shrink-0">
                <h1>Редактирование проекта №{id}</h1>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-16 border-r bg-slate-900 shrink-0">
                    {/* Инструменты */}
                </aside>

                <main className="flex-1 bg-slate-100 overflow-auto" style={{ width: '100%', height: '100%' }}>
                    <CanvasScene lineAlg={"wu"}>
                        
                    </CanvasScene>
                    {/* Холст */}
                </main>

                <aside className="w-64 border-l bg-slate-900 shrink-0">
                    {/* Свойства */}
                </aside>
            </div>
        </motion.div>
    );
};

export default Editor;