﻿import { motion } from "motion/react";
import {IGalleryItemProps} from "../Interfaces/IGalleryItem.ts";

import "../css/TailwindcssStyles.css";
import {Link} from "react-router-dom";

export default function GalleryItem({id, name, date, onOpenBtn, onCloseBtn} : IGalleryItemProps)
{
    return (
        <motion.div className="gallery-item-div"
            initial={{opacity: 0.8}}
            whileHover= {{opacity: 1, scale: 1.05}}>
            
                <p className= "pl-1 pb-2 pt-1">{id}. {name} {date}</p>
                <Link to={`/editor/${id}`}>
                    <button
                        className = "bg-blue-800 text-sm font-medium text-white hover:bg-blue-500 rounded"
                        onClick={onOpenBtn} >
                        Открыть
                    </button>
                </Link>
                    
                <button
                    className = "bg-blue-800 text-sm font-medium text-white hover:bg-blue-500 rounded ml-4"
                    onClick={onCloseBtn} >
                    Удалить проект
                </button>
        </motion.div>
    )
}