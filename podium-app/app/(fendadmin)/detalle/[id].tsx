import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    GraduationCap,
    GitBranch,
    Video,
    FileText,
    Presentation,
    ExternalLink,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    Trash2,
    CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageViewer } from "@/components/ImageViewer";
import { Project } from "@/lib/types";

const BLUE = "#2563EB";
const GREEN = "#059669";
const RED = "#DC2626";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BG = "#F5F7FA";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        aprobado: { bg: "#DCFCE7", text: "#166534", label: "Aprobado" },
        pendiente: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente" },
        rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
        evaluado: { bg: "#EDE9FE", text: "#6B21A8", label: "Evaluado" },
    };
    const s = map[status] || { bg: "#F1F5F9", text: MUTED, label: status };
    return (
        <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: s.text }}>{s.label}</Text>
        </View>
    );
}

export default function DetalleAdminScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getAllProyectos, aprobarProyecto, eliminarProyecto } = useApp();

    const [project, setProject] = useState<Project | null>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [evalExpanded, setEvalExpanded] = useState(false);
    const [loadingAction, setLoadingAction] = useState<"aprobar" | "eliminar" | null>(null);

    useEffect(() => {
        (async () => {
            setLoadingProject(true);
            const all = await getAllProyectos();
            const found = all.find((p) => p.id === id) || null;
            setProject(found);
            setLoadingProject(false);
        })();
    }, [id]);

    if (loadingProject || !project) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const ev = project.evidencias;

    const handleAprobar = () => {
        Alert.alert(
            "Aprobar proyecto",
            `¿Publicar "${project.nombre}" en el feed?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aprobar ✓",
                    onPress: async () => {
                        setLoadingAction("aprobar");
                        const result = await aprobarProyecto(project.id);
                        setLoadingAction(null);
                        if (result.ok) {
                            Alert.alert("✅ Publicado", "El proyecto ya aparece en el feed.", [
                                { text: "OK", onPress: () => router.back() },
                            ]);
                        } else {
                            Alert.alert("Error", result.error || "No se pudo aprobar el proyecto.");
                        }
                    },
                },
            ]
        );
    };

    const handleEliminar = () => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Eliminar "${project.nombre}"? Esta acción es permanente.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingAction("eliminar");
                        const result = await eliminarProyecto(project.id);
                        setLoadingAction(null);
                        if (result.ok) {
                            router.back();
                        } else {
                            Alert.alert("Error", result.error || "No se pudo eliminar el proyecto.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: project.image || `https://picsum.photos/seed/${project.id}/600/400` }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
                        <ArrowLeft size={20} color={TEXT} />
                    </TouchableOpacity>
                    <View style={styles.heroBadges}>
                        <View style={styles.categoryChip}>
                            <Text style={styles.categoryText}>{project.category || "General"}</Text>
                        </View>
                        <StatusBadge status={project.estatus} />
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Título + autores */}
                    <Text style={styles.title}>{project.nombre}</Text>
                    <Text style={styles.author}>por {project.authorName}</Text>
                    <View style={styles.correosRow}>
                        {project.autores_correos.map((c, i) => (
                            <View key={i} style={styles.correoPill}>
                                <Text style={styles.correoText}>{c}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Promedio */}
                    {project.promedio_general > 0 && (
                        <View style={styles.scoreCard}>
                            <GraduationCap size={20} color={BLUE} />
                            <Text style={styles.scoreLabel}>Promedio Docente</Text>
                            <Text style={styles.scoreValue}>{project.promedio_general}%</Text>
                        </View>
                    )}

                    {/* Descripción */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.description}>{project.descripcion}</Text>
                    </View>

                    {/* Evidencias */}
                    {(ev?.repositorio_git || ev?.videos?.length > 0 || ev?.imagenes?.length > 0 || ev?.documentos_pdf?.length > 0 || ev?.diapositivas) && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Evidencias del Proyecto</Text>
                            {ev?.repositorio_git ? (
                                <TouchableOpacity onPress={() => Linking.openURL(ev.repositorio_git)} style={styles.evidRow}>
                                    <GitBranch size={16} color={MUTED} />
                                    <Text style={styles.evidLabel}>Repositorio Git</Text>
                                    <ExternalLink size={14} color={BLUE} />
                                </TouchableOpacity>
                            ) : null}
                            {ev?.videos?.length > 0 && ev.videos.map((v, i) => (
                                <View key={i} style={{ gap: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 }}>{v.titulo}</Text>
                                    <VideoPlayer url={v.url} title={v.titulo} />
                                </View>
                            ))}
                            {ev?.imagenes?.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {ev.imagenes.map((uri: string, i: number) => (
                                        <ImageViewer key={i} uri={uri} thumbnailStyle={styles.evidImg} />
                                    ))}
                                </ScrollView>
                            )}
                            {ev?.documentos_pdf?.length > 0 && ev.documentos_pdf.map((d: string, i: number) => {
                                const label = d.split("/").pop()?.split("?")[0] || `Documento ${i + 1}`;
                                return (
                                    <TouchableOpacity key={i} style={styles.docChip} onPress={() => Linking.openURL(d)} activeOpacity={0.8}>
                                        <FileText size={14} color={BLUE} />
                                        <Text style={styles.docText} numberOfLines={1}>{label}</Text>
                                        <ExternalLink size={12} color={BLUE} />
                                    </TouchableOpacity>
                                );
                            })}
                            {ev?.diapositivas ? (
                                <TouchableOpacity onPress={() => Linking.openURL(ev.diapositivas)} style={styles.evidRow}>
                                    <Presentation size={16} color={MUTED} />
                                    <Text style={[styles.evidLabel, { color: BLUE }]}>Ver presentación</Text>
                                    <ExternalLink size={14} color={BLUE} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}

                    {/* Evaluaciones docentes */}
                    {project.evaluaciones_docentes?.length > 0 && (
                        <View style={styles.card}>
                            <TouchableOpacity
                                onPress={() => setEvalExpanded(!evalExpanded)}
                                style={styles.evalHeaderRow}
                                activeOpacity={0.8}
                            >
                                <View style={styles.evidRow}>
                                    <ShieldCheck size={18} color={BLUE} />
                                    <Text style={styles.cardTitle}>
                                        Evaluaciones ({project.evaluaciones_docentes.length})
                                    </Text>
                                </View>
                                {evalExpanded ? (
                                    <ChevronUp size={18} color={MUTED} />
                                ) : (
                                    <ChevronDown size={18} color={MUTED} />
                                )}
                            </TouchableOpacity>
                            {evalExpanded &&
                                project.evaluaciones_docentes.map((e, i) => (
                                    <View key={i} style={styles.evalCard}>
                                        <View style={styles.evalTop}>
                                            <Text style={styles.evalTeacher}>{e.nombre_maestro}</Text>
                                            <View style={styles.evalBadge}>
                                                <Text style={styles.evalBadgeText}>{e.promedio_por_maestro}%</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.evalDate}>{e.fecha_evaluacion}</Text>
                                        <Text style={styles.retroText}>{e.retroalimentacion_final}</Text>
                                    </View>
                                ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Botones de acción admin — fijos en la parte inferior */}
            <View style={styles.actionBar}>
                {project.estatus === "pendiente" && (
                    <TouchableOpacity
                        style={[styles.btnAprobar, loadingAction === "aprobar" && { opacity: 0.6 }]}
                        onPress={handleAprobar}
                        disabled={loadingAction !== null}
                        activeOpacity={0.85}
                    >
                        {loadingAction === "aprobar" ? (
                            <ActivityIndicator color={WHITE} size="small" />
                        ) : (
                            <>
                                <CheckCircle size={18} color={WHITE} />
                                <Text style={styles.btnAprobarText}>Aprobar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.btnEliminar, loadingAction === "eliminar" && { opacity: 0.6 }]}
                    onPress={handleEliminar}
                    disabled={loadingAction !== null}
                    activeOpacity={0.85}
                >
                    {loadingAction === "eliminar" ? (
                        <ActivityIndicator color={RED} size="small" />
                    ) : (
                        <>
                            <Trash2 size={18} color={RED} />
                            <Text style={styles.btnEliminarText}>Eliminar</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    hero: { height: 224, position: "relative" },
    heroImage: { width: "100%", height: "100%" },
    backBtn: {
        position: "absolute", top: 48, left: 16,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center", justifyContent: "center",
    },
    heroBadges: {
        position: "absolute", bottom: 16, left: 20, right: 20,
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    },
    categoryChip: {
        backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    categoryText: { fontSize: 12, fontWeight: "600", color: WHITE },
    body: { padding: 20, gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: TEXT },
    author: { fontSize: 14, color: MUTED },
    correosRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    correoPill: {
        backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    correoText: { fontSize: 12, color: BLUE },
    scoreCard: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: WHITE, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: BORDER,
    },
    scoreLabel: { flex: 1, fontSize: 14, color: MUTED },
    scoreValue: { fontSize: 20, fontWeight: "800", color: BLUE },
    section: { gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
    description: { fontSize: 14, color: MUTED, lineHeight: 22 },
    card: {
        backgroundColor: WHITE, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        padding: 16, gap: 10,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
    evidRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    evidLabel: { flex: 1, fontSize: 13, color: TEXT },
    evidImg: { width: 100, height: 76, borderRadius: 8, marginRight: 8 },
    docChip: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    docText: { flex: 1, fontSize: 13, color: TEXT },
    evalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalCard: {
        borderWidth: 1, borderColor: BORDER, borderRadius: 12,
        padding: 12, gap: 4, marginTop: 8,
    },
    evalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalTeacher: { fontSize: 14, fontWeight: "600", color: TEXT },
    evalBadge: { backgroundColor: BLUE, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    evalBadgeText: { fontSize: 12, fontWeight: "700", color: WHITE },
    evalDate: { fontSize: 11, color: MUTED },
    retroText: { fontSize: 12, color: MUTED, marginTop: 4 },
    // Action bar
    actionBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        flexDirection: "row", gap: 12,
        backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER,
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
    },
    btnAprobar: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14,
    },
    btnAprobarText: { fontSize: 15, fontWeight: "700", color: WHITE },
    btnEliminar: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, borderWidth: 1.5, borderColor: RED,
        borderRadius: 14, paddingVertical: 14, backgroundColor: "#FEF2F2",
    },
    btnEliminarText: { fontSize: 15, fontWeight: "700", color: RED },
});
