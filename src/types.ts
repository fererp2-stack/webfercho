export type IdeaType = 'imagen' | 'video' | 'documento' | 'otro' | 'texto';

export type IdeaCategory = 'Inspiración' | 'Diseño' | 'Contenido' | 'Negocio' | 'Personal';

export interface Idea {
  id: string;
  fecha: string | number;
  titulo: string;
  nota: string;
  categoria: IdeaCategory | string;
  enlace?: string;
  tipo: IdeaType;
  miniatura?: string;
  vistaPrevia?: string;
  abrir?: string;
}

export interface Prompt {
  id: string;
  fecha: string | number;
  actualizado?: string | number;
  titulo: string;
  contenido: string;
  carpetaId: string;
  etiquetas: string[];
  favorito: boolean;
  usos: number;
  ultimoUso?: string | number | null;
}

export interface Carpeta {
  id: string;
  nombre: string;
  icono: string;
  orden?: number;
}

export interface AppData {
  ideas: Idea[];
  prompts: Prompt[];
  carpetas: Carpeta[];
}

export interface FileData {
  base64: string;
  mimeType: string;
  nombre: string;
}
