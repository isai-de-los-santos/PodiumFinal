export type Role = "student" | "teacher" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar: string;
    university: string;
    career: string;
    /** Solo maestros: true cuando un admin los ha verificado */
    verificado?: boolean;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    date: string;
}

export interface RubricaCriterio {
    criterio: string;
    puntos_max: number;
    obtenido: number;
    obs: string;
}

export interface EvaluacionDocente {
    maestro_id: string;
    nombre_maestro: string;
    fecha_evaluacion: string;
    promedio_por_maestro: number;
    retroalimentacion_final: string;
    rubrica: RubricaCriterio[];
}

export interface Evidencias {
    repositorio_git: string;
    videos: { titulo: string; url: string }[];
    imagenes: string[];
    documentos_pdf: string[];
    diapositivas: string;
}

export interface Project {
    id: string;
    nombre: string;
    descripcion: string;
    subido_por: string;
    fecha_creacion: string;
    autores_correos: string[];
    tecnologias_aplicadas?: string;
    estatus: "pendiente" | "aprobado" | "rechazado" | "evaluado";
    promedio_general: number;
    evidencias: Evidencias;
    evaluaciones_docentes: EvaluacionDocente[];
    category: string;
    image: string;
    authorName: string;
    authorAvatar: string;
    communityRating: number;
    comments: Comment[];
    assignedTeacherId?: string;
}

export const DEFAULT_RUBRICA: { criterio: string; puntos_max: number }[] = [
    { criterio: "Comunicación y Claridad", puntos_max: 20 },
    { criterio: "Trabajo en Equipo", puntos_max: 20 },
    { criterio: "Resolución de Problemas", puntos_max: 20 },
    { criterio: "Innovación y Creatividad", puntos_max: 20 },
    { criterio: "Viabilidad e Impacto", puntos_max: 20 },
];
