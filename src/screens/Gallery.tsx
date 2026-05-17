import {useRef, useState} from "react";

import "../css/TailwindcssStyles.css";
import '../Interfaces/IGalleryItem'
import "../App.css"

import {IGalleryItem} from "../Interfaces/IGalleryItem";
import GalleryItem from "../components/GalleryItem";

export default function Gallery()  
{
    let [projects, setProjects] = useState<IGalleryItem[]>([]);

    const _id = useRef<number>(1)
    
    function deleteProject(id: string)
    {
        let newArr : IGalleryItem[] = projects.filter((item) => item.id !== id);

        setProjects(newArr);
    }
    
    const AddProject = () => {
        
        let project : IGalleryItem = {
            id: _id.current.toString(),
            name: "имя",
            date: new Date().toISOString().split("T")[0],
        }

        console.log(_id);
        
        _id.current += 1;

        setProjects((prevProjects) => [...prevProjects, project]);
    }
    
    return (
        <div className="bg-slate-900">
            <h1>
                Галерея
            </h1>
            <button className="bg-blue-800 text-sm font-medium text-white hover:bg-blue-500 rounded-md ml-4" onClick={AddProject}>
                Добавить проект
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {projects.map((item) => (<GalleryItem id={item.id} name={item.name} date={item.date} onOpenBtn={() => {}} onCloseBtn={() => deleteProject(item.id)} key = {item.id} />))}
            </div>
        </div>
    )
}