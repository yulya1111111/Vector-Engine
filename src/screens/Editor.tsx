import { motion } from "motion/react";
import { useParams } from "react-router-dom";

const Editor = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) return <div />;

    return (
        <motion.div className="h-screen w-screen overflow-hidden flex flex-col text-white">
            
            <header className="h-14 border-b bg-slate-900 px-4 shrink-0">
                <h1>проект №{id}</h1>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-16 border-r bg-slate-900 shrink-0">
                    
                </aside>

                <main className="flex-1 bg-slate-100 overflow-auto">
                    
                </main>

                <aside className="w-64 border-l bg-slate-900 shrink-0">
                    
                </aside>
            </div>
        </motion.div>
    );
};

export default Editor;