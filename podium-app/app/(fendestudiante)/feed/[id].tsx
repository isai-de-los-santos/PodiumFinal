import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Linking,
    TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Github, Image as ImageIcon, FileText, Presentation } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { Project } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer";

// DRACONIAN FLAT COLOR PALETTE
const BG = "#F3F4F6"; // Gray-50 background, NOT white
const WHITE = "#FFFFFF"; // Pure white for cards only
const TEXT = "#111827"; // Almost black for readability
const MUTED = "#6B7280"; // Gray for secondary text
const BORDER = "#E5E7EB"; // Light gray divider, NO BLUE
const ACCENT = "#374151"; // Dark gray for generic interactive icons instead of blue

export default function EstudianteProyectoDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getProject, getMisProyectos } = useApp();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                // Primero busca en memoria
                const fromMemory = getProject(id);
                if (fromMemory) {
                    if (mounted) setProject(fromMemory);
                    return;
                }
                // Si no, recarga desde API
                const mis = await getMisProyectos();
                const found = mis.find(p => p.id === id);
                if (found && mounted) setProject(found);
            } catch (err) {
                console.error("Error loading project detail:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [id]);

    const openUrl = (url?: string) => {
        if (!url) return;
        Linking.openURL(url.startsWith("http") ? url : `https://${url}`).catch(() => { });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.headerFlat}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color={TEXT} />
                        <Text style={styles.backText}>Atrás</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={MUTED} />
                </View>
            </SafeAreaView>
        );
    }

    if (!project) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.headerFlat}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color={TEXT} />
                        <Text style={styles.backText}>Atrás</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text style={{ color: MUTED }}>Proyecto no encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    const hasEvidences = project.evidencias && (
        project.evidencias.repositorio_git ||
        (project.evidencias.documentos_pdf && project.evidencias.documentos_pdf.length > 0) ||
        project.evidencias.diapositivas ||
        (project.evidencias.imagenes && project.evidencias.imagenes.length > 0)
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.headerFlat}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={TEXT} />
                    <Text style={styles.backText}>Atrás</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                {/* FLAT TEXT HEADER: Non-boxed title and basic info */}
                <View style={styles.titleSection}>
                    <Text style={styles.categoryLabel}>{(project.category || "General").toUpperCase()}</Text>
                    <Text style={styles.title}>{project.nombre}</Text>
                    <Text style={[styles.dateText, { marginBottom: 4 }]} numberOfLines={2}>
                        By {project.autores_correos?.length ? project.autores_correos.join(", ") : (project.authorName || "Desconocido")}
                    </Text>
                    <Text style={styles.dateText}>
                        Añadido: {new Date(project.fecha_creacion).toLocaleDateString("es-MX", { month: "long", day: "numeric", year: "numeric" })}
                    </Text>
                </View>

                {/* DESCRIPTION: Flat white block full width */}
                {!!project.descripcion && (
                    <View style={styles.flatBlock}>
                        <Text style={styles.sectionHeading}>Descripción</Text>
                        <Text style={styles.descriptionText}>{project.descripcion}</Text>
                    </View>
                )}

                {/* COLABORADORES */}
                {project.autores_correos && project.autores_correos.length > 0 && (
                    <View style={styles.flatBlock}>
                        <Text style={styles.sectionHeading}>Colaboradores</Text>
                        <View style={{ gap: 8 }}>
                            {project.autores_correos.map((collab, i) => (
                                <Text key={`collab-${i}`} style={styles.descriptionText}>
                                    • {collab}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* TECNOLOGÍAS APLICADAS */}
                {!!project.tecnologias_aplicadas && (
                    <View style={styles.flatBlock}>
                        <Text style={styles.sectionHeading}>Tecnologías o técnicas aplicadas</Text>
                        <Text style={styles.descriptionText}>{project.tecnologias_aplicadas}</Text>
                    </View>
                )}

                {/* EVIDENCES: Minimalist list of links */}
                {hasEvidences && (
                    <View style={styles.flatBlock}>
                        <Text style={styles.sectionHeading}>Evidencias</Text>

                        {!!project.evidencias.repositorio_git && (
                            <TouchableOpacity style={styles.rowLink} onPress={() => openUrl(project.evidencias.repositorio_git)}>
                                <Github size={20} color={ACCENT} />
                                <Text style={styles.rowLinkText} numberOfLines={1}>Repositorio (GitHub/GitLab)</Text>
                            </TouchableOpacity>
                        )}

                        {!!project.evidencias.diapositivas && (
                            <TouchableOpacity style={styles.rowLink} onPress={() => openUrl(project.evidencias.diapositivas)}>
                                <Presentation size={20} color={ACCENT} />
                                <Text style={styles.rowLinkText} numberOfLines={1}>Presentación / Diapositivas</Text>
                            </TouchableOpacity>
                        )}

                        {project.evidencias.documentos_pdf?.map((url, i) => (
                            <TouchableOpacity key={`pdf-${i}`} style={styles.rowLink} onPress={() => openUrl(url)}>
                                <FileText size={20} color={ACCENT} />
                                <Text style={styles.rowLinkText} numberOfLines={1}>Documento PDF {i + 1}</Text>
                            </TouchableOpacity>
                        ))}

                        {project.evidencias.imagenes?.map((url, i) => (
                            <TouchableOpacity key={`img-${i}`} style={styles.rowLink} onPress={() => openUrl(url)}>
                                <ImageIcon size={20} color={ACCENT} />
                                <Text style={styles.rowLinkText} numberOfLines={1}>Imagen de Evidencia {i + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* VIDEOS */}
                {project.evidencias?.videos && project.evidencias.videos.length > 0 && (
                    <View style={[styles.flatBlock, { paddingBottom: 0, borderBottomWidth: 0 }]}>
                        <Text style={styles.sectionHeading}>Videos Multimedia</Text>
                        {project.evidencias.videos.map((vid, idx) => (
                            <View key={`vid-${idx}`} style={{ marginBottom: 20 }}>
                                <Text style={styles.videoTitle}>{vid.titulo || `Video ${idx + 1}`}</Text>
                                <View style={styles.videoWrapper}>
                                    <VideoPlayer url={vid.url} />
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* EVALUATIONS: STRICTLY DEMOLISHED FORMER ACCORDION */}
                {project.evaluaciones_docentes && project.evaluaciones_docentes.length > 0 && (
                    <View style={styles.flatBlock}>
                        <Text style={styles.sectionHeading}>Evaluación Docente</Text>
                        {project.evaluaciones_docentes.map((ev, i) => (
                            <View key={`ev-${i}`} style={styles.evaluationItem}>
                                <Text style={styles.evaluatorName}>{ev.nombre_maestro || "Docente Evaluador"}</Text>
                                <Text style={styles.evalScore}>Calificación: <Text style={{ fontWeight: "700" }}>{ev.promedio_por_maestro}/100</Text></Text>
                                <Text style={styles.evalDate}>
                                    Fecha: {new Date(ev.fecha_evaluacion || Date.now()).toLocaleDateString("es-MX")}
                                </Text>

                                {!!ev.retroalimentacion_final && (
                                    <View style={styles.feedbackBox}>
                                        <Text style={styles.feedbackLabel}>Comentarios del docente:</Text>
                                        <Text style={styles.feedbackText}>{ev.retroalimentacion_final}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    // Flat Header (no massive layouts)
    headerFlat: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: WHITE,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: "600",
        color: TEXT,
    },

    scrollContainer: {
        paddingBottom: 60,
    },

    // Title Section Flat
    titleSection: {
        padding: 24,
        paddingBottom: 16,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        color: MUTED,
        marginBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: TEXT,
        lineHeight: 32,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 13,
        color: MUTED,
    },

    // Flat Block representing sections (NO enclosed heavy cards with big padding)
    flatBlock: {
        backgroundColor: WHITE,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 20,
        paddingVertical: 24,
        marginBottom: 16,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: "800",
        color: TEXT,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: "#374151",
    },

    // Row links (Thin dividers instead of expanding borders)
    rowLink: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        gap: 12,
    },
    rowLinkText: {
        fontSize: 15,
        color: TEXT,
        fontWeight: "500",
        flex: 1,
    },

    // Video 
    videoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: MUTED,
        marginBottom: 8,
    },
    videoWrapper: {
        width: "100%",
        aspectRatio: 16 / 9,
        backgroundColor: "#000",
        borderRadius: 8,
        overflow: "hidden",
    },

    // Evaluation 
    evaluationItem: {
        paddingVertical: 12,
    },
    evaluatorName: {
        fontSize: 15,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 4,
    },
    evalScore: {
        fontSize: 14,
        color: TEXT,
        marginBottom: 2,
    },
    evalDate: {
        fontSize: 12,
        color: MUTED,
        marginBottom: 12,
    },
    feedbackBox: {
        backgroundColor: BG,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BORDER,
    },
    feedbackLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 6,
    },
    feedbackText: {
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 20,
        fontStyle: "italic",
    },
});
