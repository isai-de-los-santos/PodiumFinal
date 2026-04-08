import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    GitBranch,
    Mail,
    MessageSquare,
    Presentation,
    Save,
    Users,
} from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/colors";
import { DEFAULT_RUBRICA, EvaluacionDocente, Project, RubricaCriterio } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageViewer } from "@/components/ImageViewer";

interface CriterioState extends RubricaCriterio { }

interface RubricCriterionProps {
    index: number;
    criterion: CriterioState;
    max: number;
    onChangeScore: (value: number) => void;
}

function RubricCriterion({ index, criterion, max, onChangeScore }: RubricCriterionProps) {
    const [expanded, setExpanded] = useState(index === 0);

    const toggle = () => setExpanded((prev) => !prev);

    return (
        <View style={styles.criterionCard}>
            <TouchableOpacity
                style={styles.criterionHeader}
                activeOpacity={0.9}
                onPress={toggle}
                accessibilityRole="button"
                accessibilityLabel={`Criterio ${index + 1}: ${criterion.criterio}. Puntuación actual ${criterion.obtenido} de ${max}. Tocar para ${expanded ? "colapsar" : "expandir"
                    }`}
                hitSlop={8}
            >
                <View style={styles.criterionIndexBadge}>
                    <Text style={styles.criterionIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.criterionTitleWrap}>
                    <Text style={styles.criterionTitle}>{criterion.criterio}</Text>
                    <Text style={styles.criterionScoreLabel}>
                        {criterion.obtenido}/{max}
                    </Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.criterionBody}>
                    <Text style={styles.criterionHint}>
                        Ajusta la puntuación de este criterio usando el control deslizante. Máximo {max} puntos.
                    </Text>
                    <View style={styles.sliderRow}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={max}
                            step={1}
                            value={criterion.obtenido}
                            minimumTrackTintColor={colors.accent}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.accent}
                            onValueChange={onChangeScore}
                        />
                        <View style={styles.sliderValuePill}>
                            <Text style={styles.sliderValueText}>{criterion.obtenido}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

export default function EvaluateProjectScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const { getProject, loadProjects, submitEvaluation } = useApp();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [criterios, setCriterios] = useState<CriterioState[]>(() =>
        DEFAULT_RUBRICA.map((c) => ({
            criterio: c.criterio,
            puntos_max: c.puntos_max,
            obtenido: 0,
            obs: "",
        }))
    );

    // Resetear el estado cuando cambie de proyecto (id)
    useEffect(() => {
        setFeedback("");
        setCriterios(
            DEFAULT_RUBRICA.map((c) => ({
                criterio: c.criterio,
                puntos_max: c.puntos_max,
                obtenido: 0,
                obs: "",
            }))
        );
    }, [id]);

    useEffect(() => {
        let mounted = true;
        const ensureProject = async () => {
            try {
                let current = getProject(id);
                if (!current) {
                    await loadProjects();
                    current = getProject(id);
                }
                if (mounted) {
                    setProject(current || null);
                }
            } catch (err) {
                console.error("Error loading project details for evaluate:", err);
                if (mounted) setProject(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        ensureProject();
        return () => {
            mounted = false;
        };
    }, [id]); // Removing getProject and loadProjects to avoid excessive re-renders

    const totalMax = useMemo(
        () => criterios.reduce((sum, c) => sum + c.puntos_max, 0),
        [criterios]
    );
    const totalScore = useMemo(
        () => criterios.reduce((sum, c) => sum + c.obtenido, 0),
        [criterios]
    );

    const handleChangeScore = useCallback(
        (index: number, value: number) => {
            setCriterios((prev) =>
                prev.map((c, i) =>
                    i === index
                        ? {
                            ...c,
                            obtenido: value,
                        }
                        : c
                )
            );
        },
        []
    );

    const handleSubmit = useCallback(async () => {
        if (!project || !user) return;
        setSubmitting(true);
        const evaluation: EvaluacionDocente = {
            maestro_id: user.id,
            nombre_maestro: user.name,
            fecha_evaluacion: new Date().toISOString(),
            promedio_por_maestro: totalMax > 0 ? (totalScore / totalMax) * 100 : 0,
            retroalimentacion_final: feedback.trim(),
            rubrica: criterios,
        };

        const res = await submitEvaluation(project.id, evaluation);
        setSubmitting(false);
        if (res.ok) {
            router.back();
        } else {
            console.error("submitEvaluation error:", res.error);
        }
    }, [project, user, criterios, totalMax, totalScore, feedback, submitEvaluation, router]);

    if (loading || !project) {
        return (
            <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    const ev = project.evidencias;
    const hasEvidence = !!(ev?.repositorio_git || ev?.videos?.length || ev?.imagenes?.length || ev?.documentos_pdf?.length || ev?.diapositivas);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            {/* Top bar with back & Save */}
            <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={router.back}
                    accessibilityRole="button"
                    accessibilityLabel="Volver al feed de proyectos"
                    hitSlop={8}
                >
                    <ArrowLeft size={20} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Evaluar Proyecto</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityLabel="Guardar evaluación"
                    hitSlop={8}
                >
                    <Save size={16} color="#022C22" />
                    <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Project summary card */}
                <View style={styles.projectCard}>
                    <Text style={styles.projectTitle}>{project.nombre}</Text>
                    <Text style={styles.projectMeta}>
                        By {project.autores_correos?.length ? project.autores_correos.join(", ") : (project.authorName || "Desconocido")}{project.category ? ` · ${project.category}` : ""}
                    </Text>

                    {/* Descripción */}
                    {!!project.descripcion && (
                        <Text style={styles.projectDescription}>{project.descripcion}</Text>
                    )}

                    {/* Team Members */}
                    {project.autores_correos?.length > 0 && (
                        <View style={styles.teamSection}>
                            <View style={styles.teamLabelRow}>
                                <Users size={13} color={colors.mutedForeground} />
                                <Text style={styles.teamLabel}>Team Members</Text>
                            </View>
                            {project.autores_correos.map((email: string, i: number) => (
                                <View key={i} style={styles.teamEmailRow}>
                                    <Mail size={12} color={colors.accent} />
                                    <Text style={styles.teamEmailText}>{email}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.projectBadgeRow}>
                        <View style={styles.badgeSoft}>
                            <Text style={styles.badgeSoftText}>Enviado</Text>
                        </View>
                        <Text style={styles.submittedDate}>
                            {new Date(project.fecha_creacion).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Evidence section */}
                {hasEvidence && (
                    <View style={styles.evidCard}>
                        <Text style={styles.evidCardTitle}>Evidencias del Proyecto</Text>

                        {ev?.repositorio_git ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(ev.repositorio_git)}
                                style={styles.evidRow}
                                activeOpacity={0.8}
                            >
                                <GitBranch size={15} color={colors.mutedForeground} />
                                <Text style={styles.evidLabel}>Repositorio Git</Text>
                                <ExternalLink size={13} color={colors.accent} />
                            </TouchableOpacity>
                        ) : null}

                        {ev?.videos?.length > 0 && ev.videos.map((v, i) => (
                            <View key={`vid-${i}`} style={{ marginBottom: 20, gap: 4 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.6 }}>{v.titulo || `Video ${i + 1}`}</Text>
                                <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: 14, overflow: "hidden" }}>
                                    <VideoPlayer url={v.url} title={v.titulo} />
                                </View>
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
                                    <FileText size={13} color={colors.accent} />
                                    <Text style={styles.docText} numberOfLines={1}>{label}</Text>
                                    <ExternalLink size={12} color={colors.accent} />
                                </TouchableOpacity>
                            );
                        })}

                        {ev?.diapositivas ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(ev.diapositivas)}
                                style={styles.evidRow}
                                activeOpacity={0.8}
                            >
                                <Presentation size={15} color={colors.mutedForeground} />
                                <Text style={[styles.evidLabel, { color: colors.accent }]}>Ver presentación</Text>
                                <ExternalLink size={13} color={colors.accent} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {/* Rubric section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Rúbrica de Evaluación</Text>
                    {criterios.map((c, index) => (
                        <RubricCriterion
                            key={c.criterio}
                            index={index}
                            criterion={c}
                            max={c.puntos_max}
                            onChangeScore={(value) => handleChangeScore(index, value)}
                        />
                    ))}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Puntaje Total</Text>
                        <Text style={styles.totalValue}>
                            {totalScore}/{totalMax}
                        </Text>
                    </View>

                    {/* Fase 3 — Campo de Retroalimentación */}
                    <View style={styles.feedbackSection}>
                        <View style={styles.feedbackLabelRow}>
                            <MessageSquare size={16} color={colors.accent} />
                            <Text style={styles.feedbackLabel}>Retroalimentación</Text>
                        </View>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Escribe aquí tu retroalimentación detallada para el equipo. Puedes comentar sobre fortalezas, áreas de mejora y sugerencias específicas..."
                            placeholderTextColor={colors.mutedForeground}
                            value={feedback}
                            onChangeText={setFeedback}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            maxLength={1000}
                        />
                        <Text style={styles.feedbackCounter}>{feedback.length}/1000</Text>
                    </View>
                </View>

                {/* Spacer for bottom button */}
                <View style={{ height: 96 }} />
            </ScrollView>

            {/* Bottom submit button */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.92}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar evaluación del proyecto"
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? "Enviando..." : "Enviar Evaluación"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.muted,
    },
    topTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.foreground,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#22C55E",
    },
    saveButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#022C22",
    },
    scroll: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
    },
    projectCard: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.foreground,
        marginBottom: 4,
    },
    projectMeta: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginBottom: 10,
    },
    projectBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    badgeSoft: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: `${colors.accent}18`,
    },
    badgeSoftText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.accent,
    },
    submittedDate: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    projectDescription: {
        fontSize: 13,
        color: colors.mutedForeground,
        lineHeight: 20,
        marginTop: 6,
        marginBottom: 2,
    },
    teamSection: {
        marginTop: 10,
        gap: 6,
        backgroundColor: `${colors.accent}08`,
        borderRadius: 10,
        padding: 12,
    },
    teamLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    teamLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: colors.mutedForeground,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    teamEmailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    teamEmailText: {
        fontSize: 12,
        color: colors.foreground,
        fontWeight: "500",
    },
    sectionCard: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.foreground,
        marginBottom: 12,
    },
    // Evidence card
    evidCard: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    evidCardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.foreground,
        marginBottom: 4,
    },
    evidRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 6,
    },
    evidLabel: {
        flex: 1,
        fontSize: 13,
        color: colors.mutedForeground,
    },
    evidImg: {
        width: 110,
        height: 80,
        borderRadius: 10,
        marginRight: 8,
    },
    docChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: `${colors.accent}10`,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    docText: {
        flex: 1,
        fontSize: 12,
        color: colors.mutedForeground,
    },
    // Criterion cards
    criterionCard: {
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 10,
        overflow: "hidden",
    },
    criterionHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    criterionIndexBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${colors.accent}18`,
        marginRight: 10,
    },
    criterionIndexText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.accent,
    },
    criterionTitleWrap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    criterionTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: colors.foreground,
    },
    criterionScoreLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.accent,
    },
    criterionBody: {
        paddingHorizontal: 14,
        paddingBottom: 16,
        paddingTop: 4,
        gap: 8,
    },
    criterionHint: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    sliderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderValuePill: {
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.secondary,
    },
    sliderValueText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.foreground,
    },
    totalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 18,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.foreground,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.accent,
    },
    // Fase 3 — Retroalimentación
    feedbackSection: {
        marginTop: 20,
        gap: 8,
    },
    feedbackLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    feedbackLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.foreground,
    },
    feedbackInput: {
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: colors.foreground,
        minHeight: 130,
        lineHeight: 22,
    },
    feedbackCounter: {
        fontSize: 11,
        color: colors.mutedForeground,
        textAlign: "right",
    },
    // Bottom bar
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: "rgba(244,243,248,0.97)",
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    submitButton: {
        borderRadius: 999,
        backgroundColor: "#22C55E",
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#22C55E",
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#022C22",
    },
});
