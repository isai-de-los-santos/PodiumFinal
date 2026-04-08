import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
    Users,
    ShieldCheck,
    Trash2,
    Search,
    GraduationCap,
    BookOpen,
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";

type RolFilter = "todos" | "estudiante" | "maestro" | "admin";

interface BUser {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    verificado: boolean;
}

function RolAvatar({ rol }: { rol: string }) {
    const config = {
        maestro: { icon: <GraduationCap size={18} color="#5B21B6" />, bg: "#EDE9FE" },
        admin: { icon: <Shield size={18} color="#9D174D" />, bg: "#FCE7F3" },
        estudiante: { icon: <BookOpen size={18} color="#065F46" />, bg: "#D1FAE5" },
    } as any;
    const c = config[rol] || config.estudiante;
    return <View style={[styles.avatar, { backgroundColor: c.bg }]}>{c.icon}</View>;
}

function RolBadge({ rol }: { rol: string }) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
        estudiante: { label: "Estudiante", bg: "#D1FAE5", color: "#065F46" },
        maestro: { label: "Maestro", bg: "#EDE9FE", color: "#5B21B6" },
        admin: { label: "Admin", bg: "#FCE7F3", color: "#9D174D" },
    };
    const s = map[rol] || { label: rol, bg: "#F3F4F6", color: "#374151" };
    return (
        <View style={[styles.chip, { backgroundColor: s.bg }]}>
            <Text style={[styles.chipText, { color: s.color }]}>{s.label}</Text>
        </View>
    );
}

function VerifBadge({ verificado }: { verificado: boolean }) {
    return (
        <View style={[styles.chip, { backgroundColor: verificado ? "#D1FAE5" : "#FEF3C7" }]}>
            {verificado
                ? <CheckCircle size={11} color="#065F46" />
                : <XCircle size={11} color="#92400E" />}
            <Text style={[styles.chipText, { color: verificado ? "#065F46" : "#92400E" }]}>
                {verificado ? "Verificado" : "Sin verificar"}
            </Text>
        </View>
    );
}

export default function AdminUsuariosScreen() {
    const { getAllUsuarios, verificarMaestro, eliminarUsuario } = useApp();
    const [usuarios, setUsuarios] = useState<BUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<RolFilter>("todos");
    const [search, setSearch] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAllUsuarios();
        setUsuarios(data.map((u: any) => ({
            id: u.id || u.Id || "",
            nombre: u.nombre || u.Nombre || "",
            correo: u.correo || u.Correo || "",
            rol: (u.rol || u.Rol || "estudiante").toLowerCase(),
            verificado: u.verificado ?? u.Verificado ?? false,
        })));
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const sinVerificar = usuarios.filter((u) => u.rol === "maestro" && !u.verificado).length;

    const filtered = usuarios.filter((u) => {
        const matchFilter = filter === "todos" || u.rol === filter;
        const matchSearch =
            !search.trim() ||
            u.nombre.toLowerCase().includes(search.toLowerCase()) ||
            u.correo.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const handleVerificar = (u: BUser) => {
        Alert.alert(
            "Verificar maestro",
            `¿Verificar a ${u.nombre}? Podrá evaluar proyectos con su rúbrica.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Verificar ✓",
                    onPress: async () => {
                        setActionId(u.id + ":ver");
                        const r = await verificarMaestro(u.id);
                        setActionId(null);
                        if (r.ok) { Alert.alert("✅ Verificado", `${u.nombre} ya puede evaluar proyectos.`); load(); }
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const handleEliminar = (u: BUser) => {
        Alert.alert(
            "Eliminar usuario",
            `¿Eliminar la cuenta de ${u.nombre}? Esta acción no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setActionId(u.id + ":del");
                        const r = await eliminarUsuario(u.id);
                        setActionId(null);
                        if (r.ok) load();
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: BUser }) => {
        const busy = actionId === item.id + ":ver" || actionId === item.id + ":del";
        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <RolAvatar rol={item.rol} />
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.nombre}>{item.nombre}</Text>
                        <Text style={styles.correo} numberOfLines={1}>{item.correo}</Text>
                        <View style={styles.badgeRow}>
                            <RolBadge rol={item.rol} />
                            {item.rol === "maestro" && <VerifBadge verificado={item.verificado} />}
                        </View>
                    </View>
                </View>

                {busy ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} />
                ) : (
                    <View style={styles.actions}>
                        {item.rol === "maestro" && !item.verificado && (
                            <TouchableOpacity
                                style={styles.btnVerificar}
                                onPress={() => handleVerificar(item)}
                                activeOpacity={0.8}
                            >
                                <ShieldCheck size={15} color="#fff" />
                                <Text style={styles.btnVerificarText}>Verificar maestro</Text>
                            </TouchableOpacity>
                        )}
                        {item.rol !== "admin" && (
                            <TouchableOpacity
                                style={styles.btnEliminar}
                                onPress={() => handleEliminar(item)}
                                activeOpacity={0.8}
                            >
                                <Trash2 size={15} color="#DC2626" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const FILTERS: RolFilter[] = ["todos", "maestro", "estudiante", "admin"];

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <GradientHeader>
                <View style={styles.headerRow}>
                    <Users size={22} color="#FAFAFA" />
                    <View>
                        <Text style={styles.headerTitle}>Usuarios</Text>
                        <Text style={styles.headerSub}>
                            {sinVerificar > 0
                                ? `⚠ ${sinVerificar} maestro${sinVerificar !== 1 ? "s" : ""} sin verificar`
                                : `${usuarios.length} usuarios registrados`}
                        </Text>
                    </View>
                </View>
            </GradientHeader>

            {/* Alerta de maestros sin verificar */}
            {sinVerificar > 0 && (
                <View style={styles.alertBanner}>
                    <AlertTriangle size={16} color="#92400E" />
                    <Text style={styles.alertText}>
                        {sinVerificar} maestro{sinVerificar !== 1 ? "s" : ""} esperan verificación para evaluar proyectos
                    </Text>
                </View>
            )}

            {/* Buscador */}
            <View style={styles.searchBox}>
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre o correo..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {/* Filtros */}
            <View style={styles.filters}>
                {FILTERS.map((f) => {
                    const count = usuarios.filter((u) => f === "todos" ? true : u.rol === f).length;
                    return (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterChipActive]}
                            onPress={() => setFilter(f)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(u) => u.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Users size={52} color={colors.muted} />
                        <Text style={styles.emptyText}>
                            {loading ? "Cargando usuarios..." : "No se encontraron usuarios"}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    alertBanner: {
        flexDirection: "row", alignItems: "center", gap: 10,
        marginHorizontal: 16, marginTop: 12,
        padding: 12, borderRadius: 10,
        backgroundColor: "#FEF3C7",
        borderWidth: 1, borderColor: "#FDE68A",
    },
    alertText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "500" },
    searchBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        margin: 16, marginBottom: 12,
        paddingHorizontal: 14, paddingVertical: 11,
        backgroundColor: colors.card, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.foreground },
    filters: {
        flexDirection: "row", paddingHorizontal: 16,
        gap: 8, marginBottom: 10, flexWrap: "wrap",
    },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
        borderColor: colors.border, backgroundColor: colors.card,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 12, color: colors.mutedForeground, fontWeight: "500" },
    filterTextActive: { color: "#FAFAFA", fontWeight: "700" },
    list: { padding: 16, gap: 12, paddingBottom: 32 },
    card: {
        backgroundColor: colors.card, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12,
        elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardTop: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        alignItems: "center", justifyContent: "center",
    },
    nombre: { fontSize: 15, fontWeight: "700", color: colors.foreground },
    correo: { fontSize: 12, color: colors.mutedForeground },
    badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 },
    chip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        alignSelf: "flex-start", borderRadius: 8,
        paddingHorizontal: 9, paddingVertical: 3,
    },
    chipText: { fontSize: 12, fontWeight: "600" },
    actions: { flexDirection: "row", gap: 10, alignItems: "center" },
    btnVerificar: {
        flex: 1, flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 6,
        backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10,
    },
    btnVerificarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    btnEliminar: {
        width: 42, height: 42, borderWidth: 1, borderColor: "#DC2626",
        borderRadius: 10, alignItems: "center", justifyContent: "center",
    },
    empty: { alignItems: "center", paddingTop: 72, gap: 12 },
    emptyText: { fontSize: 15, color: colors.mutedForeground },
});
