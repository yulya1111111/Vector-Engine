﻿import { motion } from "motion/react";
import { useParams } from "react-router-dom";
import EditorCanvas from "../components/EditorCanvas.tsx";

const Editor = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) return <div />;

    return (
        <motion.div className="h-screen w-screen overflow-hidden flex flex-col text-white">
            
            <header className="h-14 border-b bg-slate-900 px-4 shrink-0 flex items-center">
                <h1 className="font-bold">Редактирование проекта №{id}</h1>
            </header>
            
            <main className="flex-1 overflow-hidden" style={{ width: '100%', height: '100%' }}>
                <EditorCanvas />
            </main>
        </motion.div>
    );
};

export default Editor;