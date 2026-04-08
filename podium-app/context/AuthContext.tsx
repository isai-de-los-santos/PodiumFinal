import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Role } from "@/lib/types";

// ─── URL del backend desplegado por tu compañero en Render ───
export const API_URL = "https://kiosko-api.onrender.com/api";
const TOKEN_KEY = "podium_auth_token";
const USER_KEY = "podium_user";

/** Decodifica el payload del JWT sin librerías externas */
function decodeJwt(token: string): Record<string, any> | null {
    try {
        const base64Payload = token.split(".")[1];
        const payload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

/** Convierte el rol del backend → rol de la UI */
function mapRole(backendRole: string): Role {
    if (backendRole === "maestro") return "teacher";
    if (backendRole === "estudiante") return "student";
    if (backendRole === "admin") return "admin";
    return "student";
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (correo: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    register: (
        nombre: string,
        correo: string,
        password: string,
        rol: "estudiante" | "maestro"
    ) => Promise<{ ok: boolean; error?: string }>;
    logout: () => void;
    switchRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const [storedToken, storedUser] = await Promise.all([
                AsyncStorage.getItem(TOKEN_KEY),
                AsyncStorage.getItem(USER_KEY),
            ]);
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    /**
     * POST /api/Auth/login
     * Body: { Correo, Password }
     * Response: { Token }
     */
    const login = async (
        correo: string,
        password: string
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Correo: correo, Password: password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return { ok: false, error: data.error || "Credenciales incorrectas." };
            }

            const data = await res.json();
            const jwt = data.Token || data.token;
            if (!jwt) return { ok: false, error: "El servidor no devolvió un token." };

            // Decodificar el JWT para obtener nombre, correo, rol e id
            const claims = decodeJwt(jwt);
            const userData: User = {
                id:
                    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
                    claims?.sub ||
                    correo,
                name:
                    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                    correo.split("@")[0],
                email:
                    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
                    correo,
                role: mapRole(
                    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "estudiante"
                ),
                avatar: "",
                university: "ITSC",
                career: "Ingeniería",
                verificado:
                    (
                        claims?.["Verificado"] ||
                        claims?.verificado ||
                        "false"
                    ).toString().toLowerCase() === "true",
            };

            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, jwt),
                AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
            ]);
            setToken(jwt);
            setUser(userData);
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: "Error de conexión con el servidor." };
        }
    };

    /**
     * POST /api/Auth/register
     * Body: { Nombre, Correo, Password, Rol }
     * Roles válidos: "estudiante" | "maestro"
     */
    const register = async (
        nombre: string,
        correo: string,
        password: string,
        rol: "estudiante" | "maestro"
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/Auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Nombre: nombre, Correo: correo, Password: password, Rol: rol }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return { ok: false, error: data.error || data.mensaje || "No se pudo crear la cuenta." };
            }

            // Registro exitoso — el login se hace por separado
            return { ok: true };
        } catch {
            return { ok: false, error: "Error de conexión con el servidor." };
        }
    };

    const logout = async () => {
        await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
        ]);
        setToken(null);
        setUser(null);
    };

    /** Solo para modo demo: cambia entre student/teacher localmente */
    const switchRole = async () => {
        if (!user) return;
        const newRole: Role = user.role === "student" ? "teacher" : "student";
        const updatedUser = { ...user, role: newRole };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                loading,
                login,
                register,
                logout,
                switchRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
