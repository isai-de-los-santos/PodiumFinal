import { createClient } from "@supabase/supabase-js";

// ─── Credenciales de Supabase ───────────────────────────────────────
const SUPABASE_URL = "https://aijoplatnkbcscgqpfdl.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpam9wbGF0bmtiY3NjZ3FwZmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjIzNjIsImV4cCI6MjA4NzkzODM2Mn0.k00ySDUGu4y0ZtktSq0Uxpb1mfUEd5XdVlzbpdS3AN8";

export const BUCKET_NAME = "proyectos-storage";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Sube un archivo al bucket de Supabase Storage directamente desde el frontend.
 * No pasa por el backend — usamos la anon key con políticas de INSERT público.
 *
 * @param fileUri  - URI local del archivo (del picker de Expo)
 * @param fileName - Nombre del archivo original
 * @param mimeType - Tipo MIME (image/jpeg, application/pdf, etc.)
 * @param folder   - Subcarpeta dentro del bucket (imagenes, pdfs, videos, slides)
 * @returns URL pública del archivo subido
 */
export async function uploadToSupabase(
    fileUri: string,
    fileName: string,
    mimeType: string,
    folder: "imagenes" | "pdfs" | "videos" | "slides" = "imagenes"
): Promise<string> {
    // Generamos un nombre único para evitar colisiones
    const timestamp = Date.now();
    const ext = fileName.split(".").pop() || "bin";
    const uniqueName = `${folder}/${timestamp}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

    // En React Native, fetch puede leer URIs locales como blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, blob, {
            contentType: mimeType,
            upsert: false,
            cacheControl: "3600",
        });

    if (error) {
        throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener la URL pública
    const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return publicData.publicUrl;
}
