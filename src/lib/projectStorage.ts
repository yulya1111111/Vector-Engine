import { mkdir, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';

// Базовая папка для проектов
const PROJECTS_DIR = 'VectorEngine/projects';

// Интерфейс для индекса проекта (для галереи)
export interface ProjectIndex {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

// Интерфейс для полного состояния проекта
export interface ProjectData {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    shapes: any[];  // Массив JSON-представлений фигур
    lineAlg?: string; // Алгоритм рисования линий
}

// Получить полный путь к папке проектов
async function getProjectsDir(): Promise<string> {
    const docDir = await documentDir();
    return await join(docDir, PROJECTS_DIR);
}

// Создать папку проектов, если её нет
export async function ensureProjectsDir(): Promise<void> {
    const dir = await getProjectsDir();
    if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
    }
}

// Путь к файлу проекта
async function getProjectPath(id: number): Promise<string> {
    const dir = await getProjectsDir();
    return await join(dir, `project_${id}.json`);
}

// Путь к индексу проектов
async function getIndexPath(): Promise<string> {
    const dir = await getProjectsDir();
    return await join(dir, 'index.json');
}

// Загрузить индекс (список всех проектов)
export async function loadProjectIndex(): Promise<ProjectIndex[]> {
    await ensureProjectsDir();
    const indexPath = await getIndexPath();
    
    if (!(await exists(indexPath))) {
        return [];
    }
    
    const content = await readTextFile(indexPath);
    return JSON.parse(content);
}

// Сохранить индекс
async function saveProjectIndex(index: ProjectIndex[]): Promise<void> {
    await ensureProjectsDir();
    const indexPath = await getIndexPath();
    await writeTextFile(indexPath, JSON.stringify(index, null, 2));
}

// Сохранить проект
export async function saveProject(project: ProjectData): Promise<void> {
    await ensureProjectsDir();
    
    // Записываем файл проекта
    const projectPath = await getProjectPath(project.id);
    await writeTextFile(projectPath, JSON.stringify(project, null, 2));
    
    // Обновляем индекс
    const index = await loadProjectIndex();
    const existingIndex = index.findIndex(p => p.id === project.id);
    
    const indexEntry: ProjectIndex = {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
    
    if (existingIndex >= 0) {
        index[existingIndex] = indexEntry;
    } else {
        index.push(indexEntry);
    }
    
    await saveProjectIndex(index);
}

// Загрузить проект
export async function loadProject(id: number): Promise<ProjectData | null> {
    await ensureProjectsDir();
    const projectPath = await getProjectPath(id);
    
    if (!(await exists(projectPath))) {
        return null;
    }
    
    const content = await readTextFile(projectPath);
    return JSON.parse(content);
}