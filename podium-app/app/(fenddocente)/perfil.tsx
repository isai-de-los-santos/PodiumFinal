import React, {
    useEffect, useMemo, useState, useCallback,
} from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, TextInput, Modal,
    Pressable, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
    LogOut, BookOpen, GraduationCap, ArrowRight,
    ClipboardCheck, RefreshCw, BarChart2,
    CheckCircle, AlertTriangle, Shield, ClipboardList, Users,
    Camera, Pencil, Check, X, Bell, ChevronDown, ChevronUp,
    Mail, Briefcase, IdCard, Clock,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";

// ─── Design tokens ──────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const RED    = "#DC2626";
const WHITE  = "#FFFFFF";
const BG     = colors.background;

// ─── Types ──────────────────────────────────────────────────────────────────
interface Notif {
    id: string;
    titulo: string;
    mensaje: string;
    fecha: string;
    leida: boolean;
    tipo: "nuevo_proyecto" | "evaluacion" | "sistema";
}

// ─── Mock notifications (replace with real API later) ───────────────────────
function useMockNotifications(pendientes: any[]) {
    return useMemo<Notif[]>(() => {
        const base: Notif[] = [
            {
                id: "sys-1",
                tipo: "sistema",
                titulo: "Bienvenido al sistema",
                mensaje: "Tu cuenta de docente ha sido verificada.",
                fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
                leida: true,
            },
        ];
        pendientes.slice(0, 5).forEach((p, i) => {
            base.unshift({
                id: `proj-${p.id}`,
                tipo: "nuevo_proyecto",
                titulo: "Nuevo proyecto asignado",
                mensaje: `"${p.nombre}" está pendiente de evaluación.`,
                fecha: p.fecha_creacion || new Date().toISOString(),
                leida: false,
            });
        });
        return base;
    }, [pendientes]);
}

// ─── Notification Modal ──────────────────────────────────────────────────────
function NotifModal({
    visible, notifs, onClose, onMarkAll,
}: {
    visible: boolean;
    notifs: Notif[];
    onClose: () => void;
    onMarkAll: () => void;
}) {
    const TIPO_ICON: Record<string, React.ReactNode> = {
        nuevo_proyecto: <ClipboardCheck size={18} color={BLUE} />,
        evaluacion:     <GraduationCap  size={18} color="#7C3AED" />,
        sistema:        <Bell           size={18} color="#64748B" />,
    };

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return "ahora";
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        return `${Math.floor(h / 24)}d`;
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.notifSheet} onPress={() => {}}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.notifHeader}>
                        <Text style={styles.notifTitle}>Notificaciones</Text>
                        <TouchableOpacity onPress={onMarkAll} hitSlop={8}>
                            <Text style={styles.markAll}>Marcar todas como leídas</Text>
                        </TouchableOpacity>
                    </View>

                    {notifs.length === 0 ? (
                        <View style={styles.notifEmpty}>
                            <Bell size={36} color={colors.mutedForeground} />
                            <Text style={styles.notifEmptyText}>Sin notificaciones</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifs}
                            keyExtractor={(n) => n.id}
                            contentContainerStyle={{ paddingBottom: 24 }}
                            renderItem={({ item: n }) => (
                                <View style={[styles.notifItem, !n.leida && styles.notifItemUnread]}>
                                    <View style={styles.notifIconWrap}>
                                        {TIPO_ICON[n.tipo]}
                                    </View>
                                    <View style={styles.notifContent}>
                                        <Text style={styles.notifItemTitle}>{n.titulo}</Text>
                                        <Text style={styles.notifItemMsg} numberOfLines={2}>{n.mensaje}</Text>
                                    </View>
                                    <Text style={styles.notifTime}>{timeAgo(n.fecha)}</Text>
                                </View>
                            )}
                        />
                    )}

                    <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
                        <Text style={styles.sheetCloseText}>Cerrar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Accordion section ───────────────────────────────────────────────────────
function AccordionSection({
    icon, title, badge, children, initialOpen = true,
}: {
    icon: React.ReactNode;
    title: string;
    badge?: number;
    children: React.ReactNode;
    initialOpen?: boolean;
}) {
    const [open, setOpen] = useState(initialOpen);
    return (
        <View style={styles.accordion}>
            <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setOpen((o) => !o)}
                activeOpacity={0.75}
            >
                <View style={styles.accordionLeft}>
                    {icon}
                    <Text style={styles.accordionTitle}>{title}</Text>
                    {badge !== undefined && badge > 0 && (
                        <View style={styles.accordionBadge}>
                            <Text style={styles.accordionBadgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                {open
                    ? <ChevronUp   size={18} color={colors.mutedForeground} />
                    : <ChevronDown size={18} color={colors.mutedForeground} />}
            </TouchableOpacity>
            {open && <View style={styles.accordionBody}>{children}</View>}
        </View>
    );
}

// ─── Info row in accordion ───────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            {icon}
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || "—"}</Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth() as any;
    const { projects, loadProjects, getAllProyectos, getAllUsuarios } = useApp();

    // Admin stats
    const [adminStats, setAdminStats] = useState<{
        totalProyectos: number; pendientes: number; aprobados: number; evaluados: number;
        totalUsuarios: number; maestrosSinVerificar: number;
    } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Photo + name editing
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(user?.name || "");
    const [savingName, setSavingName] = useState(false);

    // Notifications modal
    const [showNotif, setShowNotif] = useState(false);
    const [readAll, setReadAll] = useState(false);

    const loadAdminStats = useCallback(async () => {
        if (user?.role !== "admin") return;
        setStatsLoading(true);
        const [proyectos, usuarios] = await Promise.all([getAllProyectos(), getAllUsuarios()]);
        setAdminStats({
            totalProyectos: proyectos.length,
            pendientes:     proyectos.filter((p: any) => p.estatus === "pendiente").length,
            aprobados:      proyectos.filter((p: any) => p.estatus === "aprobado").length,
            evaluados:      proyectos.filter((p: any) => p.estatus === "evaluado").length,
            totalUsuarios:  usuarios.length,
            maestrosSinVerificar: usuarios.filter((u: any) =>
                (u.rol || u.Rol || "").toLowerCase() === "maestro" && !(u.verificado ?? u.Verificado)
            ).length,
        });
        setStatsLoading(false);
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === "admin") loadAdminStats();
        else if (projects.length === 0) loadProjects();
    }, [user?.role]);

    const misProyectos = useMemo(
        () => projects.filter((p) => p.subido_por === user?.id || p.autores_correos.includes(user?.email || "")),
        [projects, user]
    );
    const pendientesPorCalificar = useMemo(
        () => projects.filter(
            (p) => p.assignedTeacherId === user?.id &&
                !p.evaluaciones_docentes.some((e) => e.maestro_id === user?.id)
        ),
        [projects, user]
    );
    const evaluados = useMemo(
        () => projects.filter((p) => p.evaluaciones_docentes.some((e) => e.maestro_id === user?.id)),
        [projects, user]
    );

    const notifs = useMockNotifications(pendientesPorCalificar);
    const unreadCount = readAll ? 0 : notifs.filter((n) => !n.leida).length;

    const rolLabel = user?.role === "teacher" ? "Docente"
        : user?.role === "admin" ? "Administrador" : "Estudiante";

    const displayName = nameInput.trim() || user?.name || rolLabel;
    const initial = displayName.charAt(0).toUpperCase();

    // Photo picker
    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled && result.assets[0]?.uri) setPhotoUri(result.assets[0].uri);
    };

    // Name save
    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed || trimmed === user?.name) { setEditingName(false); return; }
        setSavingName(true);
        try { if (typeof updateUser === "function") await updateUser({ name: trimmed }); } catch (_) {}
        setSavingName(false);
        setEditingName(false);
    };

    const handleLogout = () => { logout(); router.replace("/(auth)/login"); };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* ── Header con gradiente ─────────────────────────────── */}
                <LinearGradient colors={[BLUE, "#1D4ED8"]} style={styles.gradientHeader}>
                    {/* Bell + logout */}
                    <View style={styles.topBar}>
                        <View style={{ width: 36 }} />{/* spacer */}
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotif(true)} activeOpacity={0.8}>
                            <Bell size={20} color={WHITE} />
                            {unreadCount > 0 && (
                                <View style={styles.bellBadge}>
                                    <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Avatar editable */}
                    <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.85}>
                        {photoUri
                            ? <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
                            : <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initial}</Text></View>}
                        <View style={styles.cameraBtn}><Camera size={13} color={WHITE} /></View>
                    </TouchableOpacity>

                    {/* Nombre editable */}
                    {editingName ? (
                        <View style={styles.nameEditRow}>
                            <TextInput
                                style={styles.nameInput}
                                value={nameInput}
                                onChangeText={setNameInput}
                                autoFocus selectTextOnFocus maxLength={60}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                            {savingName
                                ? <ActivityIndicator color={WHITE} size="small" />
                                : <>
                                    <TouchableOpacity onPress={handleSaveName} style={styles.nameActionBtn}><Check size={18} color={WHITE} /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setEditingName(false); setNameInput(user?.name || ""); }} style={styles.nameActionBtn}><X size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
                                </>
                            }
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.nameDisplayRow} onPress={() => { setNameInput(displayName); setEditingName(true); }} activeOpacity={0.75}>
                            <Text style={styles.userName}>{displayName}</Text>
                            <Pencil size={13} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.rolBadge}><Text style={styles.rolBadgeText}>{rolLabel.toUpperCase()}</Text></View>
                </LinearGradient>

                {/* ── Body ────────────────────────────────────────────── */}
                <View style={styles.body}>

                    {/* ── Info personal (Acordeón) ─────── */}
                    {user?.role === "teacher" && (
                        <AccordionSection
                            icon={<IdCard size={18} color={colors.accent} />}
                            title="Información del docente"
                            initialOpen={false}
                        >
                            <InfoRow icon={<Mail     size={15} color={colors.mutedForeground} />} label="Correo electrónico"  value={user?.email || ""} />
                            <InfoRow icon={<Briefcase size={15} color={colors.mutedForeground} />} label="Área / Carrera"     value={user?.career || "Sin especificar"} />
                            <InfoRow icon={<GraduationCap size={15} color={colors.mutedForeground} />} label="Rol"            value={rolLabel} />
                            <InfoRow icon={<Clock    size={15} color={colors.mutedForeground} />} label="Proyectos evaluados" value={String(evaluados.length)} />
                            <InfoRow icon={<ClipboardCheck size={15} color={colors.mutedForeground} />} label="Pendientes"    value={String(pendientesPorCalificar.length)} />
                        </AccordionSection>
                    )}

                    {/* ── Admin stats ──────────────────── */}
                    {user?.role === "admin" && (
                        <AccordionSection
                            icon={<BarChart2 size={18} color={colors.accent} />}
                            title="Estadísticas del sistema"
                            badge={adminStats?.pendientes}
                        >
                            {statsLoading ? (
                                <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
                            ) : adminStats ? (
                                <>
                                    <View style={styles.statsGrid}>
                                        {[
                                            { label: "Proyectos", value: adminStats.totalProyectos, icon: <ClipboardList size={18} color={colors.primary} />, col: "#EFF6FF" },
                                            { label: "Pendientes", value: adminStats.pendientes,     icon: <AlertTriangle size={18} color="#92400E" />,        col: "#FEF3C7" },
                                        ].map((s) => (
                                            <View key={s.label} style={[styles.statCard, { backgroundColor: s.col }]}>
                                                {s.icon}
                                                <Text style={styles.statNum}>{s.value}</Text>
                                                <Text style={styles.statLabel}>{s.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={styles.statsGrid}>
                                        {[
                                            { label: "Aprobados",  value: adminStats.aprobados,  icon: <CheckCircle size={18} color="#059669" />, col: "#D1FAE5" },
                                            { label: "Evaluados",  value: adminStats.evaluados,  icon: <GraduationCap size={18} color={colors.accent} />, col: "#EDE9FE" },
                                        ].map((s) => (
                                            <View key={s.label} style={[styles.statCard, { backgroundColor: s.col }]}>
                                                {s.icon}
                                                <Text style={styles.statNum}>{s.value}</Text>
                                                <Text style={styles.statLabel}>{s.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity onPress={loadAdminStats} style={styles.refreshRow}>
                                        <RefreshCw size={13} color={colors.mutedForeground} />
                                        <Text style={styles.refreshText}>Actualizar estadísticas</Text>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </AccordionSection>
                    )}

                    {/* ── Pendientes por calificar ─────── (docente) */}
                    {user?.role === "teacher" && (
                        <AccordionSection
                            icon={<ClipboardCheck size={18} color={colors.accent} />}
                            title="Pendientes por calificar"
                            badge={pendientesPorCalificar.length}
                        >
                            {pendientesPorCalificar.length === 0 ? (
                                <Text style={styles.emptyText}>No tienes proyectos asignados pendientes</Text>
                            ) : (
                                pendientesPorCalificar.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.projectRow, styles.pendingRow]}
                                        onPress={() => router.push(`/(fenddocente)/feed/${p.id}` as any)}
                                        activeOpacity={0.85}
                                    >
                                        <Image source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }} style={styles.thumb} resizeMode="cover" />
                                        <View style={styles.projectInfo}>
                                            <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                            <StatusBadge status="pendiente" />
                                        </View>
                                        <ArrowRight size={16} color={colors.accent} />
                                    </TouchableOpacity>
                                ))
                            )}
                        </AccordionSection>
                    )}

                    {/* ── Historial de evaluaciones ────── (docente) */}
                    {user?.role === "teacher" && (
                        <AccordionSection
                            icon={<BookOpen size={18} color={colors.mutedForeground} />}
                            title="Historial de evaluaciones"
                            badge={evaluados.length}
                            initialOpen={false}
                        >
                            {evaluados.length === 0 ? (
                                <Text style={styles.emptyText}>Aún no has evaluado proyectos</Text>
                            ) : (
                                evaluados.map((p) => {
                                    const myEval = p.evaluaciones_docentes.find((e) => e.maestro_id === user?.id);
                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={styles.projectRow}
                                            onPress={() => router.push(`/(fenddocente)/feed/${p.id}` as any)}
                                            activeOpacity={0.85}
                                        >
                                            <Image source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }} style={styles.thumb} resizeMode="cover" />
                                            <View style={styles.projectInfo}>
                                                <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                                <View style={styles.evalMeta}>
                                                    <View style={styles.evalBadge}>
                                                        <Text style={styles.evalScore}>{myEval?.promedio_por_maestro?.toFixed(1)}%</Text>
                                                    </View>
                                                    <Text style={styles.evalDate}>
                                                        {myEval?.fecha_evaluacion
                                                            ? new Date(myEval.fecha_evaluacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
                                                            : "—"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <ArrowRight size={16} color={colors.mutedForeground} />
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </AccordionSection>
                    )}

                    {/* ── Mis proyectos (estudiante) ───── */}
                    {user?.role === "student" && (
                        <AccordionSection
                            icon={<BookOpen size={18} color={colors.accent} />}
                            title={`Mis Proyectos (${misProyectos.length})`}
                        >
                            {misProyectos.length === 0
                                ? <Text style={styles.emptyText}>No has publicado proyectos aún</Text>
                                : misProyectos.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.projectRow}
                                        onPress={() => router.push(`/(fenddocente)/feed/${p.id}` as any)}
                                        activeOpacity={0.85}
                                    >
                                        <Image source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }} style={styles.thumb} resizeMode="cover" />
                                        <View style={styles.projectInfo}>
                                            <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                            <View style={styles.projectMeta}>
                                                <GraduationCap size={12} color={colors.accent} />
                                                <Text style={styles.projectScore}>{p.promedio_general > 0 ? `${p.promedio_general}%` : "Pendiente"}</Text>
                                                <StatusBadge status={p.estatus} />
                                            </View>
                                        </View>
                                        <ArrowRight size={16} color={colors.mutedForeground} />
                                    </TouchableOpacity>
                                ))}
                        </AccordionSection>
                    )}

                    {/* ── Cerrar sesión — igual al estudiante ─────────── */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                        <LogOut size={18} color={RED} />
                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Notification modal ───────────────────────────────── */}
            <NotifModal
                visible={showNotif}
                notifs={notifs}
                onClose={() => setShowNotif(false)}
                onMarkAll={() => setReadAll(true)}
            />
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },

    gradientHeader: { alignItems: "center", paddingBottom: 28, gap: 6 },
    topBar: {
        width: "100%", flexDirection: "row",
        justifyContent: "flex-end", alignItems: "center",
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    },
    iconBtn: { position: "relative", padding: 6 },
    bellBadge: {
        position: "absolute", top: 2, right: 2,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: RED, alignItems: "center", justifyContent: "center",
        paddingHorizontal: 3,
    },
    bellBadgeText: { fontSize: 9, fontWeight: "800", color: WHITE },

    avatarWrap: { position: "relative", marginBottom: 4 },
    avatarCircle: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: "rgba(255,255,255,0.22)",
        alignItems: "center", justifyContent: "center",
    },
    avatarPhoto: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
    avatarText: { fontSize: 34, fontWeight: "700", color: WHITE },
    cameraBtn: {
        position: "absolute", bottom: 0, right: 0,
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: BLUE, borderWidth: 2, borderColor: WHITE,
        alignItems: "center", justifyContent: "center",
    },

    nameDisplayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    userName: { fontSize: 20, fontWeight: "700", color: WHITE },
    nameEditRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, gap: 8,
    },
    nameInput: { fontSize: 18, fontWeight: "600", color: WHITE, minWidth: 150, maxWidth: 220 },
    nameActionBtn: { padding: 4 },

    userEmail: { fontSize: 13, color: "rgba(255,255,255,0.72)" },
    rolBadge: {
        marginTop: 4, backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 8, paddingHorizontal: 14, paddingVertical: 4,
    },
    rolBadgeText: { fontSize: 11, fontWeight: "800", color: WHITE, letterSpacing: 1.5 },

    body: { padding: 20, gap: 14, paddingBottom: 16 },

    // Accordion
    accordion: {
        backgroundColor: colors.card,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        overflow: "hidden",
    },
    accordionHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 14,
    },
    accordionLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    accordionTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, flex: 1 },
    accordionBadge: {
        minWidth: 20, height: 20, borderRadius: 10,
        backgroundColor: BLUE, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
    },
    accordionBadgeText: { fontSize: 11, fontWeight: "800", color: WHITE },
    accordionBody: { paddingHorizontal: 16, paddingBottom: 14, gap: 8, borderTopWidth: 1, borderTopColor: colors.border },

    // Info row
    infoRow: {
        flexDirection: "row", alignItems: "center",
        gap: 12, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: `${colors.border}80`,
    },
    infoLabel: { fontSize: 11, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 },
    infoValue: { fontSize: 14, color: colors.foreground, fontWeight: "500" },

    // Stats
    statsGrid: { flexDirection: "row", gap: 10, marginTop: 4 },
    statCard: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 4, padding: 14, borderRadius: 12,
    },
    statNum:   { fontSize: 22, fontWeight: "800", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontWeight: "500", textAlign: "center" },
    refreshRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    refreshText: { fontSize: 12, color: colors.mutedForeground },

    // Project rows
    projectRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: colors.background, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border, padding: 11,
    },
    pendingRow: { borderColor: `${colors.accent}44`, backgroundColor: `${colors.accent}06` },
    thumb: { width: 50, height: 50, borderRadius: 9 },
    projectInfo: { flex: 1, gap: 4 },
    projectName: { fontSize: 13, fontWeight: "600", color: colors.foreground },
    projectMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    projectScore: { fontSize: 12, color: colors.accent, fontWeight: "500" },
    evalMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    evalBadge: { backgroundColor: `${colors.accent}18`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    evalScore: { fontSize: 12, fontWeight: "700", color: colors.accent },
    evalDate: { fontSize: 11, color: colors.mutedForeground },
    emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingVertical: 12 },

    // Logout — matches estudiante style exactly
    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, borderWidth: 1.5, borderColor: RED,
        borderRadius: 14, paddingVertical: 15, backgroundColor: "#FEF2F2",
        marginTop: 6,
    },
    logoutText: { fontSize: 15, fontWeight: "700", color: RED },

    // Notification modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    notifSheet: {
        backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 32, paddingTop: 10, maxHeight: "75%",
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
    notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    notifTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
    markAll: { fontSize: 13, color: BLUE, fontWeight: "600" },
    notifEmpty: { alignItems: "center", paddingVertical: 36, gap: 10 },
    notifEmptyText: { fontSize: 14, color: colors.mutedForeground },
    notifItem: {
        flexDirection: "row", alignItems: "flex-start",
        gap: 12, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: `${colors.border}70`,
    },
    notifItemUnread: { backgroundColor: `${BLUE}06`, marginHorizontal: -20, paddingHorizontal: 20 },
    notifIconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.muted, alignItems: "center", justifyContent: "center",
    },
    notifContent: { flex: 1, gap: 2 },
    notifItemTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
    notifItemMsg: { fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
    notifTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    sheetClose: {
        marginTop: 10, paddingVertical: 15,
        backgroundColor: colors.muted, borderRadius: 14, alignItems: "center",
    },
    sheetCloseText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
});
