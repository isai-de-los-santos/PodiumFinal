import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
    Shield,
    AlertTriangle,
    ClipboardList,
    Users,
    CheckCircle,
    Clock,
    FolderOpen,
    GraduationCap,
    ChevronRight,
    BarChart2,
    Zap,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";

interface Stats {
    totalProyectos: number;
    pendientes: number;
    aprobados: number;
    evaluados: number;
    totalUsuarios: number;
    maestrosSinVerificar: number;
}

interface RecentProject {
    id: string;
    nombre: string;
    correo: string;
    estatus: string;
}

function StatCard({
    icon,
    value,
    label,
    alert = false,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    alert?: boolean;
}) {
    return (
        <View style={[styles.statCard, alert && styles.statCardAlert]}>
            <View style={styles.statIcon}>{icon}</View>
            <Text style={[styles.statValue, alert && { color: "#92400E" }]}>
                {value}
            </Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const ESTATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: "#FEF3C7", text: "#92400E" },
    aprobado: { bg: "#D1FAE5", text: "#065F46" },
    evaluado: { bg: "#EDE9FE", text: "#5B21B6" },
    rechazado: { bg: "#FEE2E2", text: "#991B1B" },
};

export default function AdminHomeScreen() {
    const { user } = useAuth();
    const { getAllProyectos, getAllUsuarios } = useApp();
    const router = useRouter();

    const [stats, setStats] = useState<Stats | null>(null);
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [proyectos, usuarios] = await Promise.all([
                getAllProyectos(),
                getAllUsuarios(),
            ]);

            // Estadísticas globales
            setStats({
                totalProyectos: proyectos.length,
                pendientes: proyectos.filter((p: any) => p.estatus === "pendiente").length,
                aprobados: proyectos.filter((p: any) => p.estatus === "aprobado").length,
                evaluados: proyectos.filter((p: any) => p.estatus === "evaluado").length,
                totalUsuarios: usuarios.length,
                maestrosSinVerificar: usuarios.filter(
                    (u: any) =>
                        (u.rol || u.Rol || "").toLowerCase() === "maestro" &&
                        !(u.verificado ?? u.Verificado)
                ).length,
            });

            // Proyectos recientes: últimos 5 (priorizando pendientes)
            const sorted = [...proyectos].sort((a: any, b: any) => {
                if (a.estatus === "pendiente" && b.estatus !== "pendiente") return -1;
                if (a.estatus !== "pendiente" && b.estatus === "pendiente") return 1;
                return 0;
            });
            setRecentProjects(
                sorted.slice(0, 5).map((p: any) => ({
                    id: p.id || p.Id || "",
                    nombre: p.nombre || p.Nombre || "Sin título",
                    correo: (p.autores_correos || p.AutoresCorreos || [])[0] || "—",
                    estatus: (p.estatus || p.Estatus || "pendiente").toLowerCase(),
                }))
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const initial = user?.name?.charAt(0).toUpperCase() || "A";
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={loadData}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* ── HEADER HERO ── */}
                <LinearGradient
                    colors={["#2D2560", "#6366F1", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroTop}>
                        <View style={styles.heroAvatar}>
                            <Text style={styles.heroAvatarText}>{initial}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroGreeting}>{greeting},</Text>
                            <Text style={styles.heroName} numberOfLines={1}>
                                {user?.name || "Admin"}
                            </Text>
                            <View style={styles.heroBadge}>
                                <Shield size={11} color="#D946A8" />
                                <Text style={styles.heroBadgeText}>ADMINISTRADOR</Text>
                            </View>
                        </View>
                    </View>

                    {/* Mini stats dentro del hero */}
                    {stats && (
                        <View style={styles.heroMiniStats}>
                            <View style={styles.heroMiniStat}>
                                <Text style={styles.heroMiniNum}>{stats.totalProyectos}</Text>
                                <Text style={styles.heroMiniLabel}>Proyectos</Text>
                            </View>
                            <View style={styles.heroMiniDivider} />
                            <View style={styles.heroMiniStat}>
                                <Text style={[styles.heroMiniNum, stats.pendientes > 0 && { color: "#FCD34D" }]}>
                                    {stats.pendientes}
                                </Text>
                                <Text style={styles.heroMiniLabel}>Pendientes</Text>
                            </View>
                            <View style={styles.heroMiniDivider} />
                            <View style={styles.heroMiniStat}>
                                <Text style={styles.heroMiniNum}>{stats.totalUsuarios}</Text>
                                <Text style={styles.heroMiniLabel}>Usuarios</Text>
                            </View>
                        </View>
                    )}
                </LinearGradient>

                {/* ── ESTADÍSTICAS ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <BarChart2 size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Resumen del Sistema</Text>
                    </View>

                    {loading && !stats ? (
                        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} />
                    ) : stats ? (
                        <View style={styles.statsGrid}>
                            <StatCard
                                icon={<FolderOpen size={20} color={colors.primary} />}
                                value={stats.totalProyectos}
                                label="Total proyectos"
                            />
                            <StatCard
                                icon={<Clock size={20} color={stats.pendientes > 0 ? "#92400E" : colors.mutedForeground} />}
                                value={stats.pendientes}
                                label="Pendientes"
                                alert={stats.pendientes > 0}
                            />
                            <StatCard
                                icon={<CheckCircle size={20} color="#059669" />}
                                value={stats.aprobados}
                                label="Aprobados"
                            />
                            <StatCard
                                icon={<Users size={20} color={colors.accent} />}
                                value={stats.totalUsuarios}
                                label="Usuarios"
                            />
                        </View>
                    ) : null}
                </View>

                {/* ── ACCIONES URGENTES ── */}
                {stats && (stats.pendientes > 0 || stats.maestrosSinVerificar > 0) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Zap size={18} color="#F59E0B" />
                            <Text style={styles.sectionTitle}>Acciones requeridas</Text>
                        </View>

                        {stats.pendientes > 0 && (
                            <TouchableOpacity
                                style={styles.alertCard}
                                onPress={() => router.push("/(fendadmin)/moderar" as any)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.alertIconWrap}>
                                    <ClipboardList size={20} color="#92400E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.alertTitle}>
                                        {stats.pendientes} proyecto{stats.pendientes !== 1 ? "s" : ""} pendiente{stats.pendientes !== 1 ? "s" : ""}
                                    </Text>
                                    <Text style={styles.alertSub}>
                                        Esperando tu aprobación para publicarse
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#92400E" />
                            </TouchableOpacity>
                        )}

                        {stats.maestrosSinVerificar > 0 && (
                            <TouchableOpacity
                                style={[styles.alertCard, styles.alertCardPurple]}
                                onPress={() => router.push("/(fendadmin)/usuarios" as any)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.alertIconWrap, { backgroundColor: "#EDE9FE" }]}>
                                    <GraduationCap size={20} color="#5B21B6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.alertTitle, { color: "#5B21B6" }]}>
                                        {stats.maestrosSinVerificar} maestro{stats.maestrosSinVerificar !== 1 ? "s" : ""} sin verificar
                                    </Text>
                                    <Text style={styles.alertSub}>
                                        No pueden evaluar proyectos hasta ser verificados
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#5B21B6" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ── PROYECTOS RECIENTES ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <FolderOpen size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Proyectos recientes</Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(fendadmin)/moderar" as any)}
                            style={styles.seeAll}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.seeAllText}>Ver todos</Text>
                            <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {recentProjects.length === 0 && !loading ? (
                        <View style={styles.emptySection}>
                            <Text style={styles.emptyText}>No hay proyectos registrados</Text>
                        </View>
                    ) : (
                        recentProjects.map((p) => {
                            const s = ESTATUS_COLORS[p.estatus] || { bg: "#F3F4F6", text: "#374151" };
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.projectRow}
                                    onPress={() => router.push(`/(fendadmin)/detalle/${p.id}` as any)}
                                    activeOpacity={0.85}
                                >
                                    {/* Avatar inicial */}
                                    <View style={styles.projectAvatar}>
                                        <Text style={styles.projectAvatarText}>
                                            {p.nombre.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, gap: 3 }}>
                                        <Text style={styles.projectName} numberOfLines={1}>
                                            {p.nombre}
                                        </Text>
                                        <Text style={styles.projectEmail} numberOfLines={1}>
                                            {p.correo}
                                        </Text>
                                    </View>
                                    <View style={[styles.estatusBadge, { backgroundColor: s.bg }]}>
                                        <Text style={[styles.estatusText, { color: s.text }]}>
                                            {p.estatus.charAt(0).toUpperCase() + p.estatus.slice(1)}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color={colors.mutedForeground} />
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* ── ACCIONES RÁPIDAS ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Zap size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Acceso rápido</Text>
                    </View>
                    <View style={styles.quickRow}>
                        <TouchableOpacity
                            style={styles.quickBtn}
                            onPress={() => router.push("/(fendadmin)/moderar" as any)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={["#6366F1", "#8B5CF6"]}
                                style={styles.quickBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <ClipboardList size={26} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.quickBtnLabel}>Moderar{"\n"}proyectos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickBtn}
                            onPress={() => router.push("/(fendadmin)/usuarios" as any)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={["#D946A8", "#9333EA"]}
                                style={styles.quickBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Users size={26} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.quickBtnLabel}>Gestionar{"\n"}usuarios</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 16 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: 32 },

    // Hero
    hero: {
        paddingHorizontal: 22,
        paddingTop: 54,
        paddingBottom: 28,
        gap: 20,
    },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
    heroAvatar: {
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "rgba(255,255,255,0.4)",
    },
    heroAvatarText: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    heroGreeting: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
    heroName: { fontSize: 20, fontWeight: "700", color: "#FAFAFA", marginTop: 2 },
    heroBadge: {
        flexDirection: "row", alignItems: "center", gap: 5,
        marginTop: 6, alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    heroBadgeText: { fontSize: 11, fontWeight: "700", color: "#FAFAFA", letterSpacing: 0.5 },

    // Mini stats hero
    heroMiniStats: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 14, paddingVertical: 14,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    },
    heroMiniStat: { flex: 1, alignItems: "center", gap: 2 },
    heroMiniDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
    heroMiniNum: { fontSize: 22, fontWeight: "800", color: "#FAFAFA" },
    heroMiniLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

    // Sections
    section: { paddingHorizontal: 18, paddingTop: 22, gap: 12 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.foreground },
    seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
    seeAllText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

    // Stats grid
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statCard: {
        width: "47%",
        backgroundColor: colors.card,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        padding: 16, alignItems: "center", gap: 6,
    },
    statCardAlert: { borderColor: "#FDE68A", backgroundColor: "#FFFBEB" },
    statIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: "center", justifyContent: "center",
    },
    statValue: { fontSize: 26, fontWeight: "800", color: colors.foreground },
    statLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: "500", textAlign: "center" },

    // Alertas urgentes
    alertCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#FFFBEB",
        borderRadius: 14, borderWidth: 1, borderColor: "#FDE68A",
        padding: 14,
    },
    alertCardPurple: { backgroundColor: "#FAF5FF", borderColor: "#DDD6FE" },
    alertIconWrap: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: "#FEF3C7",
        alignItems: "center", justifyContent: "center",
    },
    alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400E" },
    alertSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },

    // Proyectos recientes
    projectRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: colors.card,
        borderRadius: 12, borderWidth: 1, borderColor: colors.border,
        padding: 12,
    },
    projectAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: "center", justifyContent: "center",
    },
    projectAvatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
    projectName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    projectEmail: { fontSize: 12, color: colors.mutedForeground },
    estatusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
    estatusText: { fontSize: 11, fontWeight: "700" },

    // Acceso rápido
    quickRow: { flexDirection: "row", gap: 14 },
    quickBtn: { flex: 1, alignItems: "center", gap: 10 },
    quickBtnGradient: {
        width: "100%", aspectRatio: 1.6,
        borderRadius: 18, alignItems: "center", justifyContent: "center",
    },
    quickBtnLabel: {
        fontSize: 13, fontWeight: "600", color: colors.foreground,
        textAlign: "center", lineHeight: 18,
    },

    // Empty
    emptySection: {
        padding: 24, alignItems: "center",
        backgroundColor: colors.card, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    emptyText: { fontSize: 13, color: colors.mutedForeground },
});
