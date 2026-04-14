import AsyncStorage from '@react-native-async-storage/async-storage';

// La URL base que apunta al backend desplegado en Render por tu compañero
export const API_URL = "https://kiosko-api.onrender.com/api";

const AUTH_TOKEN_KEY = "podium_auth_token";

export interface ProyectoUI {
    id: string;
    titulo: string;
    descripcion: string;
    tecnologias: string[];
    imagenUrl?: string;
    videoUrl?: string;
    estado: string;
    calificacion?: number;
    docenteNombre?: string;
    alumnoNombre: string;
    grupo: string;
    fechaSubida: string;
    visibilidad: string;
    comentariosDocente?: string;
    [key: string]: any;
}

export class BackendAPI {
    // ---- Helpers Internos ----
    private static async getHeaders(): Promise<HeadersInit> {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    private static async handleResponse(response: Response, functionName: string) {
        if (!response.ok) {
            let errorMsg = `Error HTTP ${response.status} en ${functionName}`;
            try {
                const errData = await response.json();
                if (errData.message) errorMsg = errData.message;
            } catch (e) {
                // ignore if format is not json
            }
            throw new Error(errorMsg);
        }

        // Return null for 204 No Content
        if (response.status === 204) {
            return null;
        }
        return response.json();
    }

    // ==== AUTH ====
    static async login(credenciales: any) {
        try {
            const result = await fetch(`${API_URL}/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(credenciales)
            });
            return this.handleResponse(result, "login");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async register(datos: any) {
        try {
            const result = await fetch(`${API_URL}/Auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(datos)
            });
            return this.handleResponse(result, "register");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // ==== MAPPERS ====

    private static mapProyectoBackend(p: any): ProyectoUI {
        // Mapea la estructura Proyecto de MongoDB (C#) a la UI Móvil
        return {
            id: p.id || p._id,
            titulo: p.nombre || "Sin Título",
            descripcion: p.descripcion || "",
            tecnologias: p.tecnologias || ["Sin especificar"],
            imagenUrl: p.evidencias?.imagenes?.[0] || undefined,
            videoUrl: p.evidencias?.videos?.[0]?.url || undefined,
            estado: p.estatus?.toLowerCase() || "pendiente",
            calificacion: p.promedio_general || undefined,
            docenteNombre: p.evaluaciones_docentes?.[0]?.nombre_maestro || undefined,
            alumnoNombre: p.subido_por || p.autores_correos?.[0] || "Desconocido",
            grupo: p.grupo || "N/A", // Si no lo trae el back, usar N/A
            fechaSubida: p.fecha_creacion || new Date().toISOString(),
            visibilidad: "publico", // Asumir publico si no hay flag
            comentariosDocente: p.evaluaciones_docentes?.[0]?.retroalimentacion_final || undefined,
            ...p
        };
    }

    // ==== PROYECTOS ====
    static async getProyectosAprobados() {
        try {
            const result = await fetch(`${API_URL}/Proyectos`, {
                method: "GET",
                headers: await this.getHeaders()
            });
            const data = await this.handleResponse(result, "getProyectosAprobados");
            return Array.isArray(data) ? data.map(this.mapProyectoBackend) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    static async getTodosLosProyectos() {
        try {
            const result = await fetch(`${API_URL}/Proyectos/todos`, {
                method: "GET",
                headers: await this.getHeaders()
            });
            const data = await this.handleResponse(result, "getTodosLosProyectos");
            return Array.isArray(data) ? data.map(this.mapProyectoBackend) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    static async getMisProyectos() {
        try {
            const result = await fetch(`${API_URL}/Proyectos/mis-proyectos`, {
                method: "GET",
                headers: await this.getHeaders()
            });
            const data = await this.handleResponse(result, "getMisProyectos");
            return Array.isArray(data) ? data.map(this.mapProyectoBackend) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    static async getProyecto(id: string) {
        try {
            const result = await fetch(`${API_URL}/Proyectos/${id}`, {
                method: "GET",
                headers: await this.getHeaders()
            });
            const data = await this.handleResponse(result, "getProyecto");
            return data ? this.mapProyectoBackend(data) : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    static async subirProyecto(proyectoData: any) {
        try {
            const result = await fetch(`${API_URL}/Proyectos`, {
                method: "POST",
                headers: await this.getHeaders(),
                body: JSON.stringify(proyectoData)
            });
            return this.handleResponse(result, "subirProyecto");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async evaluarProyecto(id: string, evaluacionData: any) {
        try {
            const result = await fetch(`${API_URL}/Proyectos/${id}/evaluar`, {
                method: "PUT",
                headers: await this.getHeaders(),
                body: JSON.stringify(evaluacionData)
            });
            return this.handleResponse(result, "evaluarProyecto");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
