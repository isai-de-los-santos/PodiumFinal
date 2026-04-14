/**
 * VideoThumb
 * Preview del Video de Intro en las tarjetas del feed.
 * - YouTube  → thumbnail estático de img.youtube.com
 * - MP4/Supabase/Drive → usa expo-av Video con shouldPlay+isMuted+isLooping
 * - Sin video → muestra fallbackUri (picsum placeholder)
 */
import React, { useState, useCallback } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Play } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { Project } from "@/lib/types";

// ─── YouTube helper ───────────────────────────────────────────────────────────

function extractYTId(url: string): string | null {
    const ps = [
        /youtube\.com\/watch\?v=([^&\s]+)/,
        /youtu\.be\/([^?\s]+)/,
        /youtube\.com\/embed\/([^?\s]+)/,
        /youtube\.com\/shorts\/([^?\s]+)/,
    ];
    for (const re of ps) {
        const m = url.match(re);
        if (m?.[1]) return m[1];
    }
    return null;
}

// ─── Google Drive helper ──────────────────────────────────────────────────────

function transformDriveUrl(url: string): string {
    const slash = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (slash?.[1]) {
        return `https://drive.google.com/uc?export=download&id=${slash[1]}`;
    }
    try {
        const uri = new URL(url);
        const id = uri.searchParams.get("id");
        if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    } catch { }
    return url;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VideoThumbProps {
    project: Project;
    fallbackUri?: string;
    style?: object;
    playIconSize?: number;
}

export function VideoThumb({ project, fallbackUri, style, playIconSize = 16 }: VideoThumbProps) {
    const [isFocused, setIsFocused] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => {
                setIsFocused(false);
            };
        }, [])
    );

    // Buscar el video de intro con los posibles títulos (compatibilidad con datos viejos y nuevos)
    const introVideo = project.evidencias?.videos?.find(
        (v) => v.titulo === "Intro" || v.titulo === "Video de Intro"
    );
    const videoUrl = introVideo?.url || null;

    // Sin video intro → fallback (picsum o vacío)
    if (!videoUrl) {
        if (!fallbackUri) return null;
        return (
            <View style={[styles.container, style]}>
                <Image source={{ uri: fallbackUri }} style={styles.fill} resizeMode="cover" />
            </View>
        );
    }

    const ytId = extractYTId(videoUrl);

    // YouTube → thumbnail estático + ícono ▶
    if (ytId) {
        const thumbUri = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        return (
            <View style={[styles.container, style]}>
                <Image source={{ uri: thumbUri }} style={styles.fill} resizeMode="cover" />
                <View style={styles.playOverlay}>
                    <View style={[
                        styles.playBtn,
                        { width: playIconSize + 14, height: playIconSize + 14, borderRadius: (playIconSize + 14) / 2 }
                    ]}>
                        <Play size={playIconSize} color="#fff" fill="#fff" />
                    </View>
                </View>
            </View>
        );
    }

    const isDrive = videoUrl.toLowerCase().includes("drive.google.com");
    if (isDrive) {
        const directUrl = transformDriveUrl(videoUrl);
        return (
            <View style={[styles.container, style]}>
                {isFocused ? (
                    <Video
                        source={{ uri: directUrl }}
                        style={styles.fill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        isMuted={true}
                        isLooping={true}
                        useNativeControls={false}
                    />
                ) : (
                    <Image source={{ uri: fallbackUri }} style={styles.fill} resizeMode="cover" />
                )}
                {/* Ícono de play encima por si el video tarda en cargar */}
                <View style={styles.playOverlay}>
                    <View style={[
                        styles.playBtn,
                        { width: playIconSize + 14, height: playIconSize + 14, borderRadius: (playIconSize + 14) / 2 }
                    ]}>
                        <Play size={playIconSize} color="#fff" fill="#fff" />
                    </View>
                </View>
            </View>
        );
    }

    // MP4 / Supabase → autoplay muted looped usando expo-av (SÓLO SI ESTÁ EN FOCO PARA NO SATURAR EL DECODIFICADOR)
    return (
        <View style={[styles.container, style]}>
            {isFocused ? (
                <Video
                    source={{ uri: videoUrl }}
                    style={styles.fill}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={true}
                    isMuted={true}
                    isLooping={true}
                    useNativeControls={false}
                />
            ) : fallbackUri ? (
                <Image source={{ uri: fallbackUri }} style={styles.fill} resizeMode="cover" />
            ) : (
                <View style={[styles.fill, { backgroundColor: "#1e1e1e" }]} />
            )}
            {!isFocused && (
                <View style={styles.playOverlay}>
                    <View style={[
                        styles.playBtn,
                        { width: playIconSize + 14, height: playIconSize + 14, borderRadius: (playIconSize + 14) / 2 }
                    ]}>
                        <Play size={playIconSize} color="#fff" fill="#fff" />
                    </View>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { overflow: "hidden" },
    fill: { width: "100%", height: "100%" },
    playOverlay: { position: "absolute", bottom: 8, right: 8 },
    playBtn: {
        backgroundColor: "rgba(0,0,0,0.72)",
        alignItems: "center",
        justifyContent: "center",
    },
});
