import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
    FolderOpen,
    Plus,
    Pencil,
    Trash2,
    AlertCircle,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { Project } from "@/lib/types";

// STRICT COLOR PALETTE: Zero blue outside of small distinct generic accents if explicitly necessary.
// The user strictly forbade blue thick lines and requested #F3F4F6 backgrounds and clean white cards.
const BLUE = "#2563EB"; // Minimal usage only for raw small generic icons
const TEXT = "#111827"; // Very dark gray
const MUTED = "#6B7280"; // Medium gray
const BORDER = "#E5E7EB"; // Light gray divider
const WHITE = "#FFFFFF";
const BG = "#F3F4F6";

const FILTROS = [
    { key: "todos", label: "Todos" },
    { key: "pendiente", label: "Pendiente" },
    { key: "aprobado", label: "Aprobado" },
    { key: "evaluado", label: "Evaluado" },
    { key: "rechazado", label: "Rechazado" },
];

/* Status → badge colors */
const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    aprobado: { bg: "#DCFCE7", text: "#166534", label: "Aprobado" },
    pendiente: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente" },
    rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
    evaluado: { bg: "#EDE9FE", text: "#6B21A8", label: "Evaluado" },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_BADGE[status] || { bg: "#F1F5F9", text: MUTED, label: status };
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
        </View>
    );
}

export default function MisProyectosScreen() {
    const router = useRouter();
    const { getMisProyectos, eliminarProyecto } = useApp();
    const [proyectos, setProyectos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("todos");
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getMisProyectos();
        setProyectos(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const filtered = filtro === "todos"
        ? proyectos
        : proyectos.filter((p) => p.estatus === filtro);

    const handleDelete = (p: Project) => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Eliminar "${p.nombre}"? Esta acción no puede deshacerse.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(p.id);
                        const result = await eliminarProyecto(p.id);
                        setDeleting(null);
                        if (result.ok) setProyectos((prev) => prev.filter((x) => x.id !== p.id));
                        else Alert.alert("Error", result.error || "No se pudo eliminar el proyecto.");
                    },
                },
            ]
        );
    };

    const cantidadPorFiltro = (key: string) =>
        key === "todos" ? proyectos.length : proyectos.filter((p) => p.estatus === key).length;

    const renderItem = ({ item: p }: { item: Project }) => {
        // Absolutely NO borderLeftColors, NO accordions, NO expanding logic.
        return (
            <View style={styles.cardContainer}>
                {/* Information Area */}
                <View style={styles.cardHeaderArea}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{p.nombre}</Text>
                        <Text style={styles.cardDate}>
                            Añadido: {new Date(p.fecha_creacion).toLocaleDateString("es-MX", {
                                month: "short", day: "numeric", year: "numeric",
                            })}
                        </Text>
                    </View>
                    <View style={styles.cardStatusLayer}>
                        <StatusBadge status={p.estatus} />
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Actions Area (Flat, Static, Clean) */}
                <View style={styles.cardActionArea}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/(fendestudiante)/feed/${p.id}` as any)}
                        activeOpacity={0.7}
                    >
                        <FolderOpen size={16} color={MUTED} />
                        <Text style={styles.actionBtnText}>Detalles</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push({
                            pathname: "/(fendestudiante)/crear" as any,
                            params: { editId: p.id },
                        })}
                        activeOpacity={0.7}
                    >
                        <Pencil size={16} color={MUTED} />
                        <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleDelete(p)}
                        disabled={deleting === p.id}
                        activeOpacity={0.7}
                    >
                        {deleting === p.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <>
                                <Trash2 size={16} color="#DC2626" />
                                <Text style={styles.actionBtnDangerText}>Eliminar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Proyectos</Text>
                <Text style={styles.headerCount}>
                    {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""}
                </Text>
            </View>

            {/* Filtros */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtrosRow}
            >
                {FILTROS.map((f) => {
                    const count = cantidadPorFiltro(f.key);
                    const active = filtro === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filtroPill, active && styles.filtroPillActive]}
                            onPress={() => setFiltro(f.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filtroText, active && styles.filtroTextActive]}>
                                {f.label}{count > 0 ? ` (${count})` : ""}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Aviso rechazados */}
            {proyectos.some((p) => p.estatus === "rechazado") && filtro === "todos" && (
                <View style={styles.alertBanner}>
                    <AlertCircle size={16} color="#B91C1C" />
                    <Text style={styles.alertText}>
                        Tienes {proyectos.filter((p) => p.estatus === "rechazado").length} proyecto(s) rechazado(s). Puedes editarlos y volver a enviar.
                    </Text>
                </View>
            )}

            {/* Contenido */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={MUTED} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <FolderOpen size={48} color={BORDER} />
                    <Text style={styles.emptyTitle}>
                        {filtro === "todos" ? "Aún no has subido proyectos" : `Sin proyectos con estado "${filtro}"`}
                    </Text>
                    {filtro === "todos" && (
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => router.push("/(fendestudiante)/crear" as any)}
                        >
                            <Plus size={16} color={WHITE} />
                            <Text style={styles.emptyBtnText}>Subir nuevo proyecto</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(p) => p.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row", alignItems: "baseline",
        paddingHorizontal: 20, paddingVertical: 18,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        gap: 12,
    },
    headerTitle: { fontSize: 24, fontWeight: "900", color: TEXT, letterSpacing: -0.5 },
    headerCount: { fontSize: 13, color: MUTED, fontWeight: "600" },

    filtrosRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
    filtroPill: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, backgroundColor: WHITE,
        borderWidth: 1, borderColor: BORDER,
    },
    filtroPillActive: { backgroundColor: TEXT, borderColor: TEXT },
    filtroText: { fontSize: 13, fontWeight: "600", color: MUTED },
    filtroTextActive: { color: WHITE },

    alertBanner: {
        flexDirection: "row", alignItems: "flex-start", gap: 10,
        backgroundColor: "#FEF2F2", borderRadius: 8,
        borderWidth: 1, borderColor: "#FECACA",
        padding: 14, marginHorizontal: 20, marginBottom: 8,
    },
    alertText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500", lineHeight: 18 },

    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
    emptyTitle: { fontSize: 15, color: MUTED, fontWeight: "500", textAlign: "center" },
    emptyBtn: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: TEXT, borderRadius: 10,
        paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
    },
    emptyBtnText: { fontSize: 14, fontWeight: "700", color: WHITE },

    listContent: { paddingHorizontal: 20, gap: 14, paddingBottom: 110, paddingTop: 4 },

    /* Rigid, strict-white card layout. No blue borders. No accordions. */
    cardContainer: {
        backgroundColor: WHITE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    cardHeaderArea: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 18,
    },
    cardInfo: {
        flex: 1,
        gap: 6,
        paddingRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: TEXT,
        lineHeight: 22,
    },
    cardDate: {
        fontSize: 12,
        fontWeight: "500",
        color: MUTED,
    },
    cardStatusLayer: {
        alignItems: "flex-end",
    },
    badge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

    cardDivider: {
        height: 1,
        backgroundColor: BORDER,
    },

    cardActionArea: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FCFCFD",
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: MUTED,
    },
    actionBtnDanger: {
        backgroundColor: "transparent",
    },
    actionBtnDangerText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#DC2626",
    },
});
