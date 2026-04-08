import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Menu,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertTriangle,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { GradientHeader } from "@/components/GradientHeader";
import type { Project } from "@/lib/types";

type ReviewBucket = "toReview" | "graded" | "highPriority";

interface BucketInfo {
    key: ReviewBucket;
    label: string;
    count: number;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (Number.isNaN(mins) || mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function getBuckets(projects: Project[]): BucketInfo[] {
    const toReview = projects.filter((p) => p.estatus === "pendiente").length;
    const graded = projects.filter((p) => p.estatus === "evaluado" || p.estatus === "aprobado").length;
    const highPriority = projects.filter((p) => p.communityRating < 3 && p.estatus === "pendiente").length;

    return [
        { key: "toReview", label: "To Review", count: toReview },
        { key: "graded", label: "Graded", count: graded },
        { key: "highPriority", label: "High Priority", count: highPriority },
    ];
}

function subjectFromCategory(category: string | undefined): string {
    if (!category) return "General";
    return category;
}

function TeacherProjectCard({
    project,
    onPress,
}: {
    project: Project;
    onPress: () => void;
}) {
    const subject = subjectFromCategory(project.category);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Evaluar proyecto ${project.nombre}, de ${project.authorName}`}
        >
            {/* Top row: subject pill and status icon area */}
            <View style={styles.cardHeader}>
                <View style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>{subject}</Text>
                </View>
                <View style={styles.cardStatus}>
                    {project.estatus === "pendiente" ? (
                        <Clock size={14} color="#F59E0B" />
                    ) : (
                        <CheckCircle2 size={14} color="#22C55E" />
                    )}
                </View>
            </View>

            {/* Title & meta */}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {project.nombre}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                    {project.authorName} · {timeAgo(project.fecha_creacion)}
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPress}
                    style={styles.evaluateButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir evaluación para ${project.nombre}`}
                    hitSlop={8}
                >
                    <Text style={styles.evaluateButtonText}>Evaluate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.moreButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Más opciones para ${project.nombre}`}
                    hitSlop={8}
                >
                    <MoreVertical size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

function ReviewBucketChip({
    bucket,
    isActive,
    onPress,
}: {
    bucket: BucketInfo;
    isActive: boolean;
    onPress: () => void;
}) {
    const background =
        bucket.key === "highPriority"
            ? "rgba(248, 113, 113, 0.12)"
            : "rgba(34, 197, 94, 0.16)";

    return (
        <TouchableOpacity
            style={[
                styles.bucketChip,
                {
                    backgroundColor: isActive ? background : "rgba(15,23,42,0.02)",
                    borderColor: isActive ? "transparent" : colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${bucket.label}, ${bucket.count} proyectos`}
            hitSlop={8}
        >
            <Text style={styles.bucketLabel}>{bucket.label}</Text>
            <View style={styles.bucketCountPill}>
                <Text style={styles.bucketCountText}>{bucket.count}</Text>
            </View>
        </TouchableOpacity>
    );
}

export function ProjectFeed() {
    const router = useRouter();
    const { user } = useAuth();
    const { projects, isLoading, loadProjects } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [activeBucket, setActiveBucket] = useState<ReviewBucket>("toReview");

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const teacherProjects = useMemo(() => {
        if (!user) return projects;
        const assigned = projects.filter(
            (p) => p.assignedTeacherId === user.id || !p.assignedTeacherId
        );
        return assigned;
    }, [projects, user]);

    const buckets = useMemo(() => getBuckets(teacherProjects), [teacherProjects]);

    const filteredByBucket = useMemo(() => {
        switch (activeBucket) {
            case "graded":
                return teacherProjects.filter(
                    (p) => p.estatus === "evaluado" || p.estatus === "aprobado"
                );
            case "highPriority":
                return teacherProjects.filter(
                    (p) => p.communityRating < 3 && p.estatus === "pendiente"
                );
            case "toReview":
            default:
                return teacherProjects.filter((p) => p.estatus === "pendiente");
        }
    }, [teacherProjects, activeBucket]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    }, [loadProjects]);

    const handleOpenProject = useCallback(
        (id: string) => {
            router.push(`/(fenddocente)/feed/${id}` as any);
        },
        [router]
    );

    const renderItem = useCallback(
        ({ item }: { item: Project }) => (
            <TeacherProjectCard project={item} onPress={() => handleOpenProject(item.id)} />
        ),
        [handleOpenProject]
    );

    const keyExtractor = useCallback((item: Project) => item.id, []);

    const headerComponent = (
        <>
            <GradientHeader>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Abrir menú de navegación"
                        hitSlop={8}
                    >
                        <Menu size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Project Feed</Text>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        accessibilityRole="button"
                        accessibilityLabel="Abrir filtros del feed"
                        hitSlop={8}
                    >
                        <Filter size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerSummaryRow}>
                    <View>
                        <Text style={styles.headerSubtitle}>Pending Reviews</Text>
                        <View style={styles.headerStatRow}>
                            <Text style={styles.headerStatNumber}>
                                {buckets.find((b) => b.key === "toReview")?.count ?? 0}
                            </Text>
                            <Text style={styles.headerStatLabel}>projects</Text>
                        </View>
                    </View>
                    <View style={styles.headerStatusPill}>
                        <AlertTriangle size={14} color="#16A34A" />
                        <Text style={styles.headerStatusPillText}>On Track</Text>
                    </View>
                </View>

                <View style={styles.bucketRow}>
                    {buckets.map((b) => (
                        <ReviewBucketChip
                            key={b.key}
                            bucket={b}
                            isActive={activeBucket === b.key}
                            onPress={() => setActiveBucket(b.key)}
                        />
                    ))}
                </View>
            </GradientHeader>

            <View style={styles.contentHeader}>
                <View style={styles.pendingHeaderRow}>
                    <Text style={styles.pendingTitle}>Pending Reviews</Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Ver todos los proyectos"
                        hitSlop={8}
                    >
                        <Text style={styles.pendingSeeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );

    const listEmpty = (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay proyectos en esta categoría</Text>
            <Text style={styles.emptySubtitle}>
                Cambia el filtro superior o vuelve a intentarlo más tarde.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            {isLoading && teacherProjects.length === 0 ? (
                <View style={styles.loadingFull}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={filteredByBucket}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    ListHeaderComponent={headerComponent}
                    ListEmptyComponent={listEmpty}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.accent}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingFull: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        gap: 16,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    headerIconButton: {
        padding: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
    },
    headerSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.78)",
    },
    headerStatRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: 4,
        gap: 6,
    },
    headerStatNumber: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    headerStatLabel: {
        fontSize: 13,
        color: "rgba(255,255,255,0.78)",
        marginBottom: 3,
    },
    headerStatusPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.18)",
    },
    headerStatusPillText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E5E7EB",
    },
    bucketRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        gap: 10,
    },
    bucketChip: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
    },
    bucketLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#F9FAFB",
    },
    bucketCountPill: {
        minWidth: 28,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    bucketCountText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#F9FAFB",
    },
    contentHeader: {
        paddingTop: 20,
        paddingBottom: 12,
    },
    pendingHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pendingTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.foreground,
    },
    pendingSeeAll: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.accent,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 16,
        // Soft shadow for premium feel
        shadowColor: "#000000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    subjectPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(59,130,246,0.08)",
    },
    subjectPillText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#1D4ED8",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    cardStatus: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.04)",
    },
    cardBody: {
        marginTop: 4,
        gap: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.foreground,
    },
    cardMeta: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
    },
    evaluateButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "#22C55E",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    evaluateButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#022C22",
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.02)",
    },
    emptyState: {
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.foreground,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.mutedForeground,
        textAlign: "center",
        marginTop: 6,
    },
});

