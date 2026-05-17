import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  date: string;
}

export default function Gallery() {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Мой первый проект', date: new Date().toLocaleDateString() }
  ]);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Проект ${projects.length + 1}`,
      date: new Date().toLocaleDateString()
    };
    setProjects([...projects, newProject]);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Мои проекты</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addProject}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white"
        >
          <Plus size={20} />
          Создать проект
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/editor/${project.id}`}>
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-slate-800 p-6 rounded-lg border border-slate-700 cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2 text-white">{project.name}</h2>
              <p className="text-slate-400 text-sm">Создан: {project.date}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}