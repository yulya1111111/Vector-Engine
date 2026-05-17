import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Gallery from './screens/Gallery';

function App() 
{
  let id = 5; 

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Шапка с навигацией */}

        <nav className="flex items-center justify-between p-4 border-b border-slate-800">
          <Link to="/" className="text-xl font-bold">VectorEngine</Link>
          <Link to="/editor/new" className="bg-blue-600 px-4 py-2 rounded-lg">
            Создать проект
          </Link>
        </nav>

        {/* Маршруты */}
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/editor/:id" element={<div>Здесь будет Editor для проекта {id}</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;