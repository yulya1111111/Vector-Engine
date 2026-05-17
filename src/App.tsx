import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import Gallery from "./screens/Gallery.tsx";
import Editor from "./screens/Editor.tsx";
import Main from "./screens/Main.tsx";

import "./css/TailwindcssStyles.css"
import "./App.css";

function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: -15 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, rotateX: 15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
        >
            {children}
        </motion.div>
    );
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/gallery/" element={<PageTransition><Gallery /></PageTransition>} />
                <Route path="/editor/:id" element={<PageTransition><Editor /></PageTransition>} />
                <Route path="/" element={<PageTransition><Main /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
}

function Navigation() {
    const navLinks = [
        { path: "/", label: "Главная", color: "text-gray-400", activeColor: "text-white" },
        { path: "/gallery", label: "Галерея", color: "text-blue-400", activeColor: "text-blue-300" },
    ];

    return (
        <nav className="flex items-center justify-center gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="absolute left-6 flex items-center gap-2">
                <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg"
                />
                <Link to="/" className="text-white font-bold text-xl tracking-tight hover:text-blue-400 transition-colors">
                    Vector<span className="text-blue-400">Engine</span>
                </Link>
            </div>

            <div className="flex gap-8">
                {navLinks.map((link, index) => (
                    <motion.div
                        key={link.path}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            to={link.path}
                            className={`${link.color} hover:${link.activeColor} font-medium transition-all duration-200 relative group`}
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
                        </Link>
                    </motion.div>
                ))}
            </div>
        </nav>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-900 text-white flex flex-col relative">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <Navigation />
                
                <div className="flex-1 relative overflow-hidden">
                    <AnimatedRoutes />
                </div>

                <footer className="border-t border-slate-800 py-4 px-6 text-center text-slate-500 text-sm">
                    <p>Vector Engine</p>
                </footer>
            </div>
        </BrowserRouter>
    );
}