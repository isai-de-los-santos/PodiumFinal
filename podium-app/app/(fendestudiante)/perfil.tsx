import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
    LogOut,
    FolderOpen,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    Camera,
    Pencil,
    Check,
    X,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Project } from "@/lib/types";

const BLUE    = "#2563EB";
const TEXT    = "#1E293B";
const MUTED   = "#64748B";
const WHITE   = "#FFFFFF";
const BORDER  = "#E2E8F0";
const BG      = "#F5F7FA";

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        aprobado:  { bg: "#DCFCE7", text: "#166534", label: "Aprobado"  },
        pendiente: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente" },
        rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
        evaluado:  { bg: "#EDE9FE", text: "#6B21A8", label: "Evaluado"  },
    };
    const s = config[status] || { bg: "#F1F5F9", text: MUTED, label: status };
    return (
        <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: s.text }}>{s.label}</Text>
        </View>
    );
}

export default function PerfilEstudianteScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth() as any;
    const { getMisProyectos } = useApp();

    // Datos del perfil
    const [stats, setStats] = useState({ total: 0, aprobado: 0, pendiente: 0, rechazado: 0 });
    const [recientes, setRecientes] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para foto y nombre
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(user?.name || "");
    const [savingName, setSavingName] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const proyectos = await getMisProyectos();
        setStats({
            total:     proyectos.length,
            aprobado:  proyectos.filter((p) => p.estatus === "aprobado" || p.estatus === "evaluado").length,
            pendiente: proyectos.filter((p) => p.estatus === "pendiente").length,
            rechazado: proyectos.filter((p) => p.estatus === "rechazado").length,
        });
        setRecientes(proyectos.slice(0, 3));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, []);

    // --- Foto de perfil ---
    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería para cambiar la foto de perfil.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
            // TODO: subir `result.assets[0].uri` al backend / Supabase Storage
            // y actualizar el campo `avatar_url` del usuario.
        }
    };

    // --- Nombre ---
    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed || trimmed === user?.name) { setEditingName(false); return; }
        setSavingName(true);
        try {
            // Si AuthContext expone updateUser, lo llamamos; si no, es sólo local.
            if (typeof updateUser === "function") await updateUser({ name: trimmed });
        } catch {
            // Guardado local de todas formas
        }
        setSavingName(false);
        setEditingName(false);
    };

    const handleLogout = () => {
        logout();
        router.replace("/(auth)/login");
    };

    const displayName = nameInput.trim() || user?.name || "Estudiante";
    const initial     = displayName.charAt(0).toUpperCase();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Gradient header */}
                <LinearGradient colors={[BLUE, "#1D4ED8"]} style={styles.gradientHeader}>

                    {/* Foto de perfil con botón de cámara */}
                    <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.85}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>
                        )}
                        <View style={styles.cameraBtn}>
                            <Camera size={14} color={WHITE} />
                        </View>
                    </TouchableOpacity>

                    {/* Nombre editable */}
                    {editingName ? (
                        <View style={styles.nameEditRow}>
                            <TextInput
                                style={styles.nameInput}
                                value={nameInput}
                                onChangeText={setNameInput}
                                autoFocus
                                selectTextOnFocus
                                maxLength={60}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                placeholder="Tu nombre..."
                            />
                            {savingName ? (
                                <ActivityIndicator color={WHITE} size="small" />
                            ) : (
                                <>
                                    <TouchableOpacity onPress={handleSaveName} style={styles.nameActionBtn}>
                                        <Check size={18} color={WHITE} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => { setEditingName(false); setNameInput(user?.name || ""); }}
                                        style={styles.nameActionBtn}
                                    >
                                        <X size={18} color="rgba(255,255,255,0.7)" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.nameDisplayRow}
                            onPress={() => { setNameInput(displayName); setEditingName(true); }}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.userName}>{displayName}</Text>
                            <Pencil size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.studentBadge}>
                        <Text style={styles.studentBadgeText}>ESTUDIANTE</Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Estadísticas */}
                    <View style={styles.statsCard}>
                        <Text style={styles.statsTitle}>📊 Mis Estadísticas</Text>
                        {loading ? (
                            <ActivityIndicator color={BLUE} style={{ paddingVertical: 20 }} />
                        ) : (
                            <View style={styles.statsGrid}>
                                {[
                                    { label: "TOTAL",     value: stats.total,     color: BLUE,       bg: "#EFF6FF" },
                                    { label: "APROBADOS", value: stats.aprobado,  color: "#16A34A",  bg: "#F0FDF4" },
                                    { label: "PENDIENTES",value: stats.pendiente, color: "#CA8A04",  bg: "#FEFCE8" },
                                    { label: "RECHAZADOS",value: stats.rechazado, color: "#DC2626",  bg: "#FEF2F2" },
                                ].map(({ label, value, color, bg }) => (
                                    <View key={label} style={[styles.statCell, { backgroundColor: bg }]}>
                                        <Text style={styles.statLabel}>{label}</Text>
                                        <Text style={[styles.statNum, { color }]}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Proyectos recientes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Proyectos recientes</Text>
                            <TouchableOpacity onPress={() => router.push("/(fendestudiante)/mis-proyectos" as any)}>
                                <Text style={styles.verTodos}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? null : recientes.length === 0 ? (
                            <Text style={styles.emptyText}>Aún no has subido proyectos.</Text>
                        ) : (
                            recientes.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.recentItem}
                                    onPress={() => router.push(`/(fendestudiante)/feed/${p.id}` as any)}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.projectIcon}>
                                        <Text style={styles.projectEmoji}>📁</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                        <Text style={styles.projectDate}>
                                            Enviado: {new Date(p.fecha_creacion).toLocaleDateString("es-MX", {
                                                month: "short", day: "numeric", year: "numeric",
                                            })}
                                        </Text>
                                    </View>
                                    <StatusBadge status={p.estatus} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Cerrar sesión */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                        <LogOut size={18} color="#DC2626" />
                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    gradientHeader: {
        alignItems: "center",
        paddingTop: 30,
        paddingBottom: 28,
        gap: 6,
    },
    // Avatar con foto
    avatarWrap: { position: "relative", marginBottom: 4 },
    avatarCircle: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center", justifyContent: "center",
    },
    avatarPhoto: {
        width: 84, height: 84, borderRadius: 42,
        borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    },
    avatarText: { fontSize: 34, fontWeight: "700", color: WHITE },
    cameraBtn: {
        position: "absolute", bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: BLUE,
        borderWidth: 2, borderColor: WHITE,
        alignItems: "center", justifyContent: "center",
    },
    // Nombre editable
    nameDisplayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    userName: { fontSize: 20, fontWeight: "700", color: WHITE },
    nameEditRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
        gap: 8,
    },
    nameInput: {
        fontSize: 18, fontWeight: "600", color: WHITE,
        minWidth: 150, maxWidth: 220,
    },
    nameActionBtn: { padding: 4 },
    userEmail: { fontSize: 13, color: "rgba(255,255,255,0.72)" },
    studentBadge: {
        marginTop: 4, backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 8, paddingHorizontal: 16, paddingVertical: 5,
    },
    studentBadgeText: { fontSize: 11, fontWeight: "800", color: WHITE, letterSpacing: 1.5 },
    body: { padding: 20, gap: 20 },
    // Stats
    statsCard: {
        backgroundColor: WHITE, borderRadius: 20, padding: 18,
        elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
        shadowRadius: 8, gap: 14,
    },
    statsTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statCell: {
        flex: 1, minWidth: "45%", borderRadius: 14,
        padding: 14, gap: 4,
    },
    statLabel: { fontSize: 10, fontWeight: "700", color: MUTED, letterSpacing: 0.5 },
    statNum: { fontSize: 30, fontWeight: "800" },
    // Recientes
    section: { gap: 10 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
    verTodos: { fontSize: 13, fontWeight: "600", color: BLUE },
    recentItem: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: WHITE, borderRadius: 14, padding: 13,
        borderWidth: 1, borderColor: BORDER,
    },
    projectIcon: {
        width: 42, height: 42, borderRadius: 11,
        backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
    },
    projectEmoji: { fontSize: 19 },
    projectName: { fontSize: 13, fontWeight: "600", color: TEXT },
    projectDate: { fontSize: 11, color: MUTED, marginTop: 2 },
    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, borderWidth: 1.5, borderColor: "#DC2626",
        borderRadius: 14, paddingVertical: 15, backgroundColor: "#FEF2F2",
    },
    logoutText: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
    emptyText: { textAlign: "center", color: MUTED, fontSize: 13 },
});
