import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Alert, // Added Alert
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import YoutubeIframe from "react-native-youtube-iframe";
import { ExternalLink, Play } from "lucide-react-native";
import { useFocusEffect } from "expo-router";

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
    const patterns = [
        /youtube\.com\/watch\?v=([^&\s]+)/,
        /youtu\.be\/([^?\s]+)/,
        /youtube\.com\/embed\/([^?\s]+)/,
        /youtube\.com\/shorts\/([^?\s]+)/,
    ];
    for (const re of patterns) {
        const m = url.match(re);
        if (m?.[1]) return m[1];
    }
    return null;
}

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

type VideoType = "youtube" | "native" | "external";

function detectType(url: string): VideoType {
    if (!url?.trim()) return "external";
    const lower = url.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
    if (
        lower.endsWith(".mp4") ||
        lower.endsWith(".m3u8") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".webm") ||
        lower.includes("drive.google.com") ||
        lower.includes("supabase") // uploaded videos from the app
    )
        return "native";
    return "external";
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface VideoPlayerProps {
    url: string;
    title?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VideoPlayer({ url, title }: VideoPlayerProps) {
    const [nativeError, setNativeError] = useState(false);
    const videoRef = useRef<Video>(null);
    const [ytPlaying, setYtPlaying] = useState(false);

    // Stop videos when navigating away
    useFocusEffect(
        useCallback(() => {
            return () => {
                // native AV
                if (videoRef.current) {
                    videoRef.current.unloadAsync().catch(() => {});
                }
                // YouTube
                setYtPlaying(false);
            };
        }, [])
    );

    // Standard unmount cleanup to prevent decoder leaks (Android Exoplayer limit issue)
    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch(() => {});
            }
        };
    }, []);

    if (!url?.trim()) return null;

    const type = detectType(url);

    // ── YouTube ──────────────────────────────────────────────────────────────
    if (type === "youtube") {
        const videoId = extractYouTubeId(url);
        if (!videoId) return <FallbackButton url={url} title={title} />;
        return (
            // YoutubeIframe maneja sus propias dimensiones y fullscreen nativo
            <View style={styles.ytContainer}>
                <YoutubeIframe
                    height={220}
                    videoId={videoId}
                    play={ytPlaying}
                    onChangeState={(state: string) => {
                        if (state === "playing") setYtPlaying(true);
                        else if (state === "paused" || state === "ended") setYtPlaying(false);
                    }}
                    webViewProps={{
                        allowsFullscreenVideo: true,
                        allowsInlineMediaPlayback: true,
                    }}
                    webViewStyle={{ borderRadius: 14 }}
                />
            </View>
        );
    }

    // ── Native MP4 / Google Drive / Supabase ─────────────────────────────────
    if (type === "native") {
        if (nativeError) {
            return (
                <View style={[styles.nativeContainer, { justifyContent: "center", alignItems: "center", backgroundColor: "#1e1e1e", gap: 10 }]}>
                    <Text style={{ color: "#f87171", fontSize: 13, fontWeight: "600" }}>Error al cargar video</Text>
                    <FallbackButton url={url} title="Intentar abrir externamente" />
                </View>
            );
        }

        const finalUrl = url.includes("drive.google.com") ? transformDriveUrl(url) : encodeURI(url.trim());
        return (
            // aspectRatio 16:9, sin fixed height para que se adapte al ancho
            <View style={styles.nativeContainer}>
                <Video
                    ref={videoRef}
                    source={{ uri: finalUrl }}
                    style={styles.nativeVideo}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    onError={(e) => {
                        console.log("Video Error:", e);
                        Alert.alert("Error Técnico Video", `Contexto: ${title}\nURL: ${finalUrl}\nDetalle: ${JSON.stringify(e)}`);
                        if (videoRef.current) {
                            videoRef.current.unloadAsync().catch(() => {});
                        }
                        setNativeError(true);
                    }}
                />
            </View>
        );
    }

    // ── Fallback: external link ──────────────────────────────────────────────
    return <FallbackButton url={url} title={title} />;
}

// ─── Fallback Button ─────────────────────────────────────────────────────────

function FallbackButton({ url, title }: { url: string; title?: string }) {
    return (
        <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            style={styles.fallback}
            activeOpacity={0.85}
        >
            <View style={styles.fallbackIcon}>
                <Play size={16} color="#2563EB" />
            </View>
            <Text style={styles.fallbackTitle} numberOfLines={1}>
                {title || "Ver video"}
            </Text>
            <ExternalLink size={14} color="#93C5FD" />
        </TouchableOpacity>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    ytContainer: {
        width: "100%",
        minHeight: 220,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#000",
    },
    // Native video: usa aspectRatio para adaptarse al ancho disponible
    nativeContainer: {
        width: "100%",
        aspectRatio: 16 / 9,
        backgroundColor: "#000",
        borderRadius: 14,
        overflow: "hidden",
    },
    nativeVideo: {
        ...StyleSheet.absoluteFillObject,
    },
    fallback: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#EFF6FF",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    fallbackIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
    },
    fallbackTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#1D4ED8",
    },
});
