import React, { useState, useCallback, useRef } from "react";
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
    Modal,
    Pressable,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
    CheckCircle,
    Trash2,
    Search,
    Star,
    ClipboardList,
    MoreVertical,
    Eye,
    AlertCircle,
    ChevronDown,
    X,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { Project } from "@/lib/types";

const ESTATUS_FILTERS = ["todos", "pendiente", "aprobado", "evaluado"] as const;
type Filter = (typeof ESTATUS_FILTERS)[number];

const ESTATUS_META: Record<string, { bg: string; text: string; label: string }> = {
    pendiente: { bg: "#FEF3C7", text: "#92400E", label: "Pendiente" },
    aprobado:  { bg: "#D1FAE5", text: "#065F46", label: "Aprobado"  },
    evaluado:  { bg: "#EDE9FE", text: "#5B21B6", label: "Evaluado"  },
    rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
};

function EstatusBadge({ estatus }: { estatus: string }) {
    const s = ESTATUS_META[estatus] || { bg: "#F3F4F6", text: "#374151", label: estatus };
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
        </View>
    );
}

interface ActionSheetProps {
    visible: boolean;
    project: Project | null;
    onClose: () => void;
    onAprobar: () => void;
    onEliminar: () => void;
    onVerDetalle: () => void;
    loading: boolean;
}

function ActionSheet({ visible, project, onClose, onAprobar, onEliminar, onVerDetalle, loading }: ActionSheetProps) {
    if (!project) return null;
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.sheetOverlay} onPress={onClose}>
                <Pressable style={styles.sheetContainer} onPress={() => {}}>
                    {/* Handle */}
                    <View style={styles.sheetHandle} />

                    {/* Header del proyecto */}
                    <View style={styles.sheetHeader}>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.sheetTitle} numberOfLines={2}>{project.nombre}</Text>
                            <Text style={styles.sheetSub} numberOfLines={1}>{project.autores_correos[0] || "Sin autor"}</Text>
                        </View>
                        <EstatusBadge estatus={project.estatus} />
                    </View>

                    <View style={styles.sheetDivider} />

                    {/* Acciones */}
                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} />
                    ) : (
                        <View style={styles.sheetActions}>
                            <TouchableOpacity style={styles.sheetAction} onPress={onVerDetalle} activeOpacity={0.7}>
                                <View style={[styles.sheetActionIcon, { backgroundColor: `${colors.primary}14` }]}>
                                    <Eye size={20} color={colors.primary} />
                                </View>
                                <View style={styles.sheetActionText}>
                                    <Text style={styles.sheetActionTitle}>Ver detalles</Text>
                                    <Text style={styles.sheetActionSub}>Revisar evidencias y evaluaciones</Text>
                                </View>
                                <ChevronDown size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: "-90deg" }] }} />
                            </TouchableOpacity>

                            {project.estatus === "pendiente" && (
                                <TouchableOpacity style={styles.sheetAction} onPress={onAprobar} activeOpacity={0.7}>
                                    <View style={[styles.sheetActionIcon, { backgroundColor: "#D1FAE5" }]}>
                                        <CheckCircle size={20} color="#059669" />
                                    </View>
                                    <View style={styles.sheetActionText}>
                                        <Text style={[styles.sheetActionTitle, { color: "#059669" }]}>Aprobar proyecto</Text>
                                        <Text style={styles.sheetActionSub}>Publicar en el feed de la aplicación</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.sheetAction} onPress={onEliminar} activeOpacity={0.7}>
                                <View style={[styles.sheetActionIcon, { backgroundColor: "#FEE2E2" }]}>
                                    <Trash2 size={20} color="#DC2626" />
                                </View>
                                <View style={styles.sheetActionText}>
                                    <Text style={[styles.sheetActionTitle, { color: "#DC2626" }]}>Eliminar proyecto</Text>
                                    <Text style={styles.sheetActionSub}>Acción permanente e irreversible</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.sheetCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export default function AdminModerarScreen() {
    const { getAllProyectos, aprobarProyecto, eliminarProyecto } = useApp();
    const router = useRouter();
    const [proyectos, setProyectos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<Filter>("pendiente");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Project | null>(null);
    const [sheetLoading, setSheetLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAllProyectos();
        setProyectos(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const pendientesCount = proyectos.filter((p) => p.estatus === "pendiente").length;

    const filtered = proyectos.filter((p) => {
        const matchFilter = filter === "todos" || p.estatus === filter;
        const matchSearch =
            !search.trim() ||
            p.nombre.toLowerCase().includes(search.toLowerCase()) ||
            p.autores_correos.some((c) => c.toLowerCase().includes(search.toLowerCase()));
        return matchFilter && matchSearch;
    });

    const handleAprobar = () => {
        if (!selected) return;
        Alert.alert(
            "Aprobar proyecto",
            `¿Publicar "${selected.nombre}" en el feed?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aprobar ✓",
                    onPress: async () => {
                        setSheetLoading(true);
                        const r = await aprobarProyecto(selected.id);
                        setSheetLoading(false);
                        if (r.ok) {
                            setSelected(null);
                            Alert.alert("✅ Publicado", "El proyecto ya aparece en el feed.");
                            load();
                        } else {
                            Alert.alert("Error", r.error);
                        }
                    },
                },
            ]
        );
    };

    const handleEliminar = () => {
        if (!selected) return;
        Alert.alert(
            "Eliminar proyecto",
            `¿Eliminar "${selected.nombre}"? Esta acción es permanente.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setSheetLoading(true);
                        const r = await eliminarProyecto(selected.id);
                        setSheetLoading(false);
                        setSelected(null);
                        if (r.ok) load();
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const handleVerDetalle = () => {
        if (!selected) return;
        setSelected(null);
        router.push(`/(fendadmin)/detalle/${selected.id}` as any);
    };

    const renderItem = ({ item }: { item: Project }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(fendadmin)/detalle/${item.id}` as any)}
            activeOpacity={0.88}
        >
            {/* Fila principal */}
            <View style={styles.cardRow}>
                {/* Indicador de color por estatus */}
                <View style={[styles.cardAccent, { backgroundColor: ESTATUS_META[item.estatus]?.bg || "#F3F4F6" }]}>
                    <AlertCircle size={16} color={ESTATUS_META[item.estatus]?.text || "#374151"} />
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.cardAuthor} numberOfLines={1}>
                        {item.autores_correos[0] || "Sin autor"} · {new Date(item.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </Text>
                    <View style={styles.cardFooter}>
                        <EstatusBadge estatus={item.estatus} />
                        {item.promedio_general > 0 && (
                            <View style={styles.ratingRow}>
                                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.ratingText}>{item.promedio_general.toFixed(1)}%</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Botón de menú */}
                <TouchableOpacity
                    style={styles.menuBtn}
                    onPress={() => setSelected(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <MoreVertical size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <GradientHeader>
                <View style={styles.headerRow}>
                    <ClipboardList size={22} color="#FAFAFA" />
                    <View>
                        <Text style={styles.headerTitle}>Moderación</Text>
                        <Text style={styles.headerSub}>
                            {pendientesCount > 0
                                ? `${pendientesCount} proyecto${pendientesCount !== 1 ? "s" : ""} pendiente${pendientesCount !== 1 ? "s" : ""}`
                                : "Todo al día ✓"}
                        </Text>
                    </View>
                </View>
            </GradientHeader>

            {/* Buscador */}
            <View style={styles.searchBox}>
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar proyecto o autor..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                        <X size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtros */}
            <View style={styles.filters}>
                {ESTATUS_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && styles.filterChipActive]}
                        onPress={() => setFilter(f)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {ESTATUS_META[f]?.label ?? f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === "pendiente" && pendientesCount > 0 ? ` (${pendientesCount})` : ""}
                            {f === "todos" ? ` (${proyectos.length})` : ""}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(p) => p.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <CheckCircle size={48} color={colors.muted} />
                        <Text style={styles.emptyTitle}>
                            {loading ? "Cargando proyectos..." : "Sin proyectos aquí"}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {!loading && filter === "pendiente"
                                ? "No hay proyectos esperando aprobación"
                                : ""}
                        </Text>
                    </View>
                }
            />

            {/* Action Sheet */}
            <ActionSheet
                visible={!!selected}
                project={selected}
                onClose={() => setSelected(null)}
                onAprobar={handleAprobar}
                onEliminar={handleEliminar}
                onVerDetalle={handleVerDetalle}
                loading={sheetLoading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

    searchBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        margin: 16, paddingHorizontal: 14, paddingVertical: 11,
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

    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },

    // Tarjeta de proyecto — diseño horizontal compacto
    card: {
        backgroundColor: colors.card, borderRadius: 14,
        borderWidth: 1, borderColor: colors.border,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000", shadowOpacity: 0.04,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14, paddingRight: 14, gap: 12,
    },
    cardAccent: {
        width: 48, alignSelf: "stretch",
        alignItems: "center", justifyContent: "center",
        borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
    },
    cardInfo: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
    cardAuthor: { fontSize: 12, color: colors.mutedForeground },
    cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
    badge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    ratingRow: {
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#FEF3C7", borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 2,
    },
    ratingText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
    menuBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: "center", justifyContent: "center",
        backgroundColor: colors.muted,
    },

    empty: { alignItems: "center", paddingTop: 64, gap: 10 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.mutedForeground },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },

    // Action sheet
    sheetOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    sheetContainer: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 32,
        paddingTop: 10,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: "center", marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: "row", alignItems: "flex-start",
        gap: 12, marginBottom: 16,
    },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    sheetSub: { fontSize: 13, color: colors.mutedForeground },
    sheetDivider: { height: 1, backgroundColor: colors.border, marginBottom: 8 },
    sheetActions: { gap: 4 },
    sheetAction: {
        flexDirection: "row", alignItems: "center",
        gap: 14, paddingVertical: 14,
        borderRadius: 12,
    },
    sheetActionIcon: {
        width: 42, height: 42, borderRadius: 12,
        alignItems: "center", justifyContent: "center",
    },
    sheetActionText: { flex: 1, gap: 2 },
    sheetActionTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    sheetActionSub: { fontSize: 12, color: colors.mutedForeground },
    sheetCancel: {
        marginTop: 8, paddingVertical: 16,
        backgroundColor: colors.muted,
        borderRadius: 14, alignItems: "center",
    },
    sheetCancelText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
});
