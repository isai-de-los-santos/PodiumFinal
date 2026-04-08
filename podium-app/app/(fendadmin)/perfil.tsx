import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    LogOut,
    Shield,
    BarChart2,
    ClipboardList,
    Users,
    CheckCircle,
    AlertTriangle,
    FolderOpen,
    GraduationCap,
    RefreshCw,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
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

export default function AdminPerfilScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { getAllProyectos, getAllUsuarios } = useApp();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);

    const loadStats = useCallback(async () => {
        setLoading(true);
        const [proyectos, usuarios] = await Promise.all([getAllProyectos(), getAllUsuarios()]);
        setStats({
            totalProyectos: proyectos.length,
            pendientes: proyectos.filter((p: any) => p.estatus === "pendiente").length,
            aprobados: proyectos.filter((p: any) => p.estatus === "aprobado").length,
            evaluados: proyectos.filter((p: any) => p.estatus === "evaluado").length,
            totalUsuarios: usuarios.length,
            maestrosSinVerificar: usuarios.filter(
                (u: any) => (u.rol || u.Rol || "").toLowerCase() === "maestro" && !(u.verificado ?? u.Verificado)
            ).length,
        });
        setLoading(false);
    }, []);

    useEffect(() => { loadStats(); }, []);

    const initial = user?.name?.charAt(0).toUpperCase() || "A";

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <GradientHeader>
                    <View style={styles.headerRow}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{user?.name}</Text>
                                <View style={styles.adminBadge}>
                                    <Shield size={11} color="#D946A8" />
                                    <Text style={styles.adminBadgeText}>ADMINISTRADOR</Text>
                                </View>
                                <Text style={styles.userEmail}>{user?.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => { logout(); router.replace("/(auth)/login"); }}
                            style={styles.logoutBtn}
                            activeOpacity={0.8}
                        >
                            <LogOut size={20} color="#FAFAFA" />
                        </TouchableOpacity>
                    </View>
                </GradientHeader>

                <View style={styles.body}>
                    {/* Stats */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <BarChart2 size={18} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Estadísticas del Sistema</Text>
                            <TouchableOpacity onPress={loadStats} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <RefreshCw size={15} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
                        ) : stats ? (
                            <>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <FolderOpen size={18} color={colors.primary} />
                                        <Text style={styles.statNum}>{stats.totalProyectos}</Text>
                                        <Text style={styles.statLabel}>Proyectos</Text>
                                    </View>
                                    <View style={[styles.statCard, stats.pendientes > 0 && styles.statCardAlert]}>
                                        <AlertTriangle size={18} color={stats.pendientes > 0 ? "#92400E" : colors.mutedForeground} />
                                        <Text style={[styles.statNum, stats.pendientes > 0 && { color: "#92400E" }]}>{stats.pendientes}</Text>
                                        <Text style={styles.statLabel}>Pendientes</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <CheckCircle size={18} color="#059669" />
                                        <Text style={styles.statNum}>{stats.aprobados}</Text>
                                        <Text style={styles.statLabel}>Aprobados</Text>
                                    </View>
                                </View>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <Users size={18} color={colors.primary} />
                                        <Text style={styles.statNum}>{stats.totalUsuarios}</Text>
                                        <Text style={styles.statLabel}>Usuarios</Text>
                                    </View>
                                    <View style={[styles.statCard, stats.maestrosSinVerificar > 0 && styles.statCardAlert]}>
                                        <GraduationCap size={18} color={stats.maestrosSinVerificar > 0 ? "#92400E" : "#059669"} />
                                        <Text style={[styles.statNum, stats.maestrosSinVerificar > 0 && { color: "#92400E" }]}>{stats.maestrosSinVerificar}</Text>
                                        <Text style={styles.statLabel}>Sin verificar</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <ClipboardList size={18} color={colors.accent} />
                                        <Text style={styles.statNum}>{stats.evaluados}</Text>
                                        <Text style={styles.statLabel}>Evaluados</Text>
                                    </View>
                                </View>
                            </>
                        ) : null}
                    </View>

                    {/* Logout */}
                    <TouchableOpacity
                        style={styles.logoutFullBtn}
                        onPress={() => { logout(); router.replace("/(auth)/login"); }}
                        activeOpacity={0.85}
                    >
                        <LogOut size={18} color="#DC2626" />
                        <Text style={styles.logoutFullText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    userInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    avatarText: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    userName: { fontSize: 18, fontWeight: "700", color: "#FAFAFA" },
    adminBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        marginTop: 3, alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    },
    adminBadgeText: { fontSize: 10, fontWeight: "700", color: "#FAFAFA", letterSpacing: 0.5 },
    userEmail: { fontSize: 12, color: "rgba(250,250,250,0.7)", marginTop: 2 },
    logoutBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    body: { padding: 20, gap: 20 },
    section: { gap: 12 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.foreground },
    statsGrid: { flexDirection: "row", gap: 10 },
    statCard: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 5, padding: 14,
        backgroundColor: colors.card,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    },
    statCardAlert: { borderColor: "#FDE68A", backgroundColor: "#FFFBEB" },
    statNum: { fontSize: 22, fontWeight: "800", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontWeight: "500", textAlign: "center" },
    logoutFullBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 10, borderWidth: 1.5, borderColor: "#DC2626",
        borderRadius: 12, paddingVertical: 14,
        backgroundColor: "#FEF2F2",
    },
    logoutFullText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
