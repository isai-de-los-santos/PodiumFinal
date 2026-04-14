import React, { useState, useEffect, useRef, useCallback } from "react";

import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    Image as ImageIcon,
    GitBranch,
    Video,
    Rocket,
    X,
    Link as LinkIcon,
    UploadCloud,
    CheckCircle,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/types";

const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BG = "#F8FAFC";
const RED = "#DC2626";
const GREEN = "#16A34A";

// ── Tipos de video ──────────────────────────────────────────────────────────
type VideoSlotKey = "intro" | "evidencia" | "evidenciaExtra";

interface VideoSlot {
    url: string;        // URL final (ya subida o link manual)
    pendingUri: string; // URI local mientras se sube
    isUploading: boolean;
    linkDraft: string;  // texto del input de link antes de confirmar
    showLinkInput: boolean;
}

function emptySlot(): VideoSlot {
    return { url: "", pendingUri: "", isUploading: false, linkDraft: "", showLinkInput: false };
}

const SLOT_LABELS: Record<VideoSlotKey, string> = {
    intro: "Video de Intro",
    evidencia: "Video de Evidencia",
    evidenciaExtra: "Video de Evidencia Extra",
};

// ── Componente VideoSlotCard ─────────────────────────────────────────────────
interface VideoSlotCardProps {
    slotKey: VideoSlotKey;
    slot: VideoSlot;
    onChange: (key: VideoSlotKey, patch: Partial<VideoSlot>) => void;
    onPickFile: (key: VideoSlotKey) => void;
    onCancel: (key: VideoSlotKey) => void;
}

function VideoSlotCard({ slotKey, slot, onChange, onPickFile, onCancel }: VideoSlotCardProps) {
    const label = SLOT_LABELS[slotKey];
    const hasVideo = !!slot.url;

    const confirmLink = () => {
        const trimmed = slot.linkDraft.trim();
        if (!trimmed) return;
        onChange(slotKey, { url: trimmed, showLinkInput: false });
    };

    const removeVideo = () => {
        onChange(slotKey, { url: "", pendingUri: "", linkDraft: "", showLinkInput: false });
    };

    return (
        <View style={vStyles.card}>
            <View style={vStyles.cardHeader}>
                <Video size={15} color={BLUE} />
                <Text style={vStyles.cardTitle}>{label}</Text>
                {hasVideo && (
                    <TouchableOpacity onPress={removeVideo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={16} color={RED} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Estado: ya hay video */}
            {hasVideo ? (
                <View style={vStyles.doneRow}>
                    <CheckCircle size={14} color={GREEN} />
                    <Text style={vStyles.doneText} numberOfLines={1}>{slot.url}</Text>
                </View>
            ) : slot.isUploading ? (
                /* Estado: subiendo */
                <View style={vStyles.uploadingRow}>
                    <ActivityIndicator size="small" color={BLUE} />
                    <Text style={vStyles.uploadingText}>Subiendo video...</Text>
                    <TouchableOpacity onPress={() => onCancel(slotKey)} style={vStyles.cancelBtn}>
                        <X size={13} color={RED} />
                        <Text style={vStyles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* Estado: vacío — mostrar opciones */
                <>
                    <View style={vStyles.actionRow}>
                        <TouchableOpacity style={vStyles.actionBtn} onPress={() => onPickFile(slotKey)} activeOpacity={0.8}>
                            <UploadCloud size={16} color={BLUE} />
                            <Text style={vStyles.actionBtnText}>Subir archivo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={vStyles.actionBtn}
                            onPress={() => onChange(slotKey, { showLinkInput: !slot.showLinkInput })}
                            activeOpacity={0.8}
                        >
                            <LinkIcon size={16} color={BLUE} />
                            <Text style={vStyles.actionBtnText}>Pegar link</Text>
                        </TouchableOpacity>
                    </View>

                    {slot.showLinkInput && (
                        <View style={vStyles.linkRow}>
                            <TextInput
                                style={vStyles.linkInput}
                                placeholder="https://..."
                                placeholderTextColor={MUTED}
                                value={slot.linkDraft}
                                onChangeText={(v) => onChange(slotKey, { linkDraft: v })}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                            <TouchableOpacity style={vStyles.linkConfirmBtn} onPress={confirmLink} activeOpacity={0.8}>
                                <Text style={vStyles.linkConfirmText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

// ── Pantalla principal ───────────────────────────────────────────────────────
export default function CrearProyectoScreen() {
    const router = useRouter();
    const { editId } = useLocalSearchParams<{ editId?: string }>();
    const { user } = useAuth();
    const { addProject, updateProyecto, uploadFile, getMisProyectos } = useApp();

    const isEdit = !!editId;

    // Form state
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tecnologias, setTecnologias] = useState("");
    const [autores, setAutores] = useState<string[]>([user?.name || ""]);
    const [repoUrl, setRepoUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [imagenes, setImagenes] = useState<string[]>([]);

    // 3 slots de video independientes
    const [videoSlots, setVideoSlots] = useState<Record<VideoSlotKey, VideoSlot>>({
        intro: emptySlot(),
        evidencia: emptySlot(),
        evidenciaExtra: emptySlot(),
    });

    // Refs de cancelación por slot
    const cancelFlagsRef = useRef<Record<VideoSlotKey, boolean>>({
        intro: false,
        evidencia: false,
        evidenciaExtra: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);

    const isPickerOpenRef = useRef(false);

    // ── Helpers de slots ─────────────────────────────────────────────────────
    const patchSlot = useCallback((key: VideoSlotKey, patch: Partial<VideoSlot>) => {
        setVideoSlots((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    }, []);

    // ── Reset form ───────────────────────────────────────────────────────────
    const resetForm = useCallback(() => {
        setNombre("");
        setDescripcion("");
        setTecnologias("");
        setAutores([user?.name || ""]);
        setRepoUrl("");
        setPdfUrl("");
        setImagenes([]);
        setVideoSlots({ intro: emptySlot(), evidencia: emptySlot(), evidenciaExtra: emptySlot() });
        setUploadingPdf(false);
        setUploadingImg(false);
    }, [user?.name]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (!isEdit && !isPickerOpenRef.current) resetForm();
            };
        }, [isEdit, resetForm])
    );

    // ── Cargar datos en modo edición ─────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            setLoadingEdit(true);
            const proyectos = await getMisProyectos();
            const p = proyectos.find((x) => x.id === editId);
            if (p) {
                setNombre(p.nombre);
                setDescripcion(p.descripcion);
                setTecnologias(p.tecnologias_aplicadas || "");
                setAutores(p.autores_correos?.length ? p.autores_correos : [user?.name || ""]);
                setRepoUrl(p.evidencias?.repositorio_git || "");
                setPdfUrl(p.evidencias?.documentos_pdf?.[0] || "");
                setImagenes(p.evidencias?.imagenes || []);

                const vs = p.evidencias?.videos || [];
                const getSlot = (titulo: string): VideoSlot => {
                    const v = vs.find((x: any) => x.titulo === titulo);
                    return v ? { ...emptySlot(), url: v.url } : emptySlot();
                };
                setVideoSlots({
                    intro: getSlot("Intro"),
                    evidencia: getSlot("Evidencia"),
                    evidenciaExtra: getSlot("Evidencia Extra"),
                });
            }
            setLoadingEdit(false);
        })();
    }, [editId]);

    // ── Autores ──────────────────────────────────────────────────────────────
    const addAuthor = () => setAutores((prev) => [...prev, ""]);
    const removeAuthor = (i: number) => setAutores((prev) => prev.filter((_, idx) => idx !== i));
    const setAuthor = (i: number, val: string) =>
        setAutores((prev) => prev.map((a, idx) => (idx === i ? val : a)));

    // ── PDF ──────────────────────────────────────────────────────────────────
    const pickPdf = async () => {
        isPickerOpenRef.current = true;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf"],
                copyToCacheDirectory: true,
            });
            isPickerOpenRef.current = false;
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            setUploadingPdf(true);
            const url = await uploadFile(asset.uri, asset.name, "application/pdf");
            setPdfUrl(url);
        } catch (e) {
            Alert.alert("Error al subir PDF", (e as any)?.message || String(e));
        } finally {
            isPickerOpenRef.current = false;
            setUploadingPdf(false);
        }
    };

    // ── Imágenes ─────────────────────────────────────────────────────────────
    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permiso requerido", "Se necesita acceso a la galería.");
            return;
        }
        isPickerOpenRef.current = true;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsMultipleSelection: true,
            });
            isPickerOpenRef.current = false;
            if (result.canceled || !result.assets?.length) return;
            setUploadingImg(true);
            const urls: string[] = [];
            for (const asset of result.assets) {
                const fileName = asset.fileName || `img_${Date.now()}.jpg`;
                const url = await uploadFile(asset.uri, fileName, "image/jpeg");
                urls.push(url);
            }
            setImagenes((prev) => [...prev, ...urls]);
        } catch (e) {
            Alert.alert("Error al subir imágenes", (e as any)?.message || String(e));
        } finally {
            isPickerOpenRef.current = false;
            setUploadingImg(false);
        }
    };

    // ── Video: subir desde archivo ────────────────────────────────────────────
    const handlePickVideoFile = async (key: VideoSlotKey) => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permiso requerido", "Se necesita acceso a la galería.");
            return;
        }
        isPickerOpenRef.current = true;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 1,
                allowsMultipleSelection: false,
            });
            isPickerOpenRef.current = false;
            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const ext = asset.uri.split(".").pop()?.toLowerCase() || "mp4";
            const mimeType = ext === "mov" ? "video/quicktime" : `video/${ext}`;
            const fileName = asset.fileName || `video_${Date.now()}.${ext}`;

            cancelFlagsRef.current[key] = false;
            patchSlot(key, { isUploading: true, pendingUri: asset.uri });

            const url = await uploadFile(asset.uri, fileName, mimeType);

            // Si fue cancelado durante la subida, no actualizar
            if (cancelFlagsRef.current[key]) return;

            patchSlot(key, { url, isUploading: false, pendingUri: "" });
        } catch (e) {
            if (!cancelFlagsRef.current[key]) {
                Alert.alert("Error al subir video", (e as any)?.message || String(e));
            }
            patchSlot(key, { isUploading: false, pendingUri: "" });
        } finally {
            isPickerOpenRef.current = false;
        }
    };

    // ── Video: cancelar subida ────────────────────────────────────────────────
    const handleCancelUpload = (key: VideoSlotKey) => {
        cancelFlagsRef.current[key] = true;
        patchSlot(key, { isUploading: false, pendingUri: "" });
    };

    // ── Validación y envío ───────────────────────────────────────────────────
    const validate = () => {
        if (!nombre.trim()) return "El nombre del proyecto es requerido.";
        if (!descripcion.trim()) return "La descripción es requerida.";
        if (!tecnologias.trim()) return "El campo de tecnologías o técnicas aplicadas es obligatorio.";
        if (autores.some((a) => !a.trim())) return "Completa todos los nombres de los colaboradores.";
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { Alert.alert("Falta información", err); return; }

        setSubmitting(true);

        // Construir array de videos (solo los que tienen URL)
        const videosArr: { titulo: string; url: string }[] = [];
        if (videoSlots.intro.url) videosArr.push({ titulo: "Intro", url: videoSlots.intro.url });
        if (videoSlots.evidencia.url) videosArr.push({ titulo: "Evidencia", url: videoSlots.evidencia.url });
        if (videoSlots.evidenciaExtra.url) videosArr.push({ titulo: "Evidencia Extra", url: videoSlots.evidenciaExtra.url });

        const data: Partial<Project> = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tecnologias_aplicadas: tecnologias.trim(),
            autores_correos: autores.map((a) => a.trim()),
            evidencias: {
                repositorio_git: repoUrl.trim(),
                videos: videosArr,
                imagenes: imagenes,
                documentos_pdf: pdfUrl ? [pdfUrl] : [],
                diapositivas: "",
            },
        };

        const result = isEdit
            ? await updateProyecto(editId!, data)
            : await addProject(data);

        setSubmitting(false);

        if (result.ok) {
            if (!isEdit) resetForm();
            Alert.alert(
                isEdit ? "Proyecto actualizado" : "Proyecto enviado",
                isEdit
                    ? "Tu proyecto fue actualizado y volvió a estado pendiente."
                    : "Tu proyecto fue enviado y está en revisión.",
                [{ text: "OK", onPress: () => router.replace("/(fendestudiante)/mis-proyectos" as any) }]
            );
        } else {
            Alert.alert("Error", result.error || "Ocurrió un error al publicar.");
        }
    };

    if (loadingEdit) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}><ActivityIndicator size="large" color={BLUE} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={TEXT} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? "Editar Proyecto" : "Create Project"}</Text>
                <View style={styles.dotsRow}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isEdit && (
                    <View style={styles.editNotice}>
                        <Text style={styles.editNoticeText}>
                            ⚠️ Editar el proyecto lo regresará a estado "Pendiente" para revisión.
                        </Text>
                    </View>
                )}

                {/* PROJECT DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PROJECT DETAILS</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Project Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Eco-Friendly Water Filter"
                            placeholderTextColor={MUTED}
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Describe the problem you are solving and your solution..."
                            placeholderTextColor={MUTED}
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* TECNOLOGÍAS */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>TECNOLOGÍAS O TÉCNICAS APLICADAS</Text>
                    <View style={styles.field}>
                        <TextInput
                            style={[styles.input, { height: 80, paddingTop: 13 }]}
                            placeholder="Ej. React Native, Supabase, Entrevistas a usuarios, etc."
                            placeholderTextColor={MUTED}
                            value={tecnologias}
                            onChangeText={setTecnologias}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* TEAM MEMBERS */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionLabel}>COLABORADORES</Text>
                        <TouchableOpacity onPress={addAuthor}>
                            <Text style={styles.addAuthorLink}>Añadir colaborador</Text>
                        </TouchableOpacity>
                    </View>
                    {autores.map((nombreCollab, i) => (
                        <View key={i} style={styles.authorRow}>
                            <TextInput
                                style={[styles.input, styles.authorInput]}
                                placeholder={i === 0 ? "Tu nombre" : "Nombre del colaborador"}
                                placeholderTextColor={MUTED}
                                value={nombreCollab}
                                onChangeText={(v) => setAuthor(i, v)}
                                autoCapitalize="words"
                            />
                            {i > 0 && (
                                <TouchableOpacity onPress={() => removeAuthor(i)} style={styles.removeBtn}>
                                    <Trash2 size={16} color={RED} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* EVIDENCES */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>EVIDENCIAS</Text>

                    {/* PDF + Images */}
                    <View style={styles.uploadRow}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickPdf} disabled={uploadingPdf}>
                            {uploadingPdf ? (
                                <ActivityIndicator size="small" color={BLUE} />
                            ) : (
                                <>
                                    <FileText size={24} color={BLUE} />
                                    <Text style={styles.uploadText}>{pdfUrl ? "PDF subido ✓" : "Upload PDF"}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploadingImg}>
                            {uploadingImg ? (
                                <ActivityIndicator size="small" color={BLUE} />
                            ) : (
                                <>
                                    <ImageIcon size={24} color={BLUE} />
                                    <Text style={styles.uploadText}>Upload Images</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Image Thumbnails */}
                    {imagenes.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 4 }}>
                            {imagenes.map((uri, index) => (
                                <View key={index} style={styles.thumbnailWrapper}>
                                    <Image source={{ uri }} style={styles.thumbnailImg} resizeMode="cover" />
                                    <TouchableOpacity style={styles.removeThumbnailBtn} onPress={() => setImagenes(prev => prev.filter((_, i) => i !== index))}>
                                        <X size={12} color={WHITE} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Git / Link evidencia */}
                    <View style={styles.urlField}>
                        <GitBranch size={16} color={MUTED} />
                        <TextInput
                            style={styles.urlInput}
                            placeholder="Link evidencia (repo, sitio, etc.)"
                            placeholderTextColor={MUTED}
                            value={repoUrl}
                            onChangeText={setRepoUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        {repoUrl ? <TouchableOpacity onPress={() => setRepoUrl("")}><X size={14} color={MUTED} /></TouchableOpacity> : null}
                    </View>
                </View>

                {/* VIDEOS */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>VIDEOS DE EVIDENCIA</Text>
                    {(["intro", "evidencia", "evidenciaExtra"] as VideoSlotKey[]).map((key) => (
                        <VideoSlotCard
                            key={key}
                            slotKey={key}
                            slot={videoSlots[key]}
                            onChange={patchSlot}
                            onPickFile={handlePickVideoFile}
                            onCancel={handleCancelUpload}
                        />
                    ))}
                </View>

                {/* Botón Publicar */}
                <TouchableOpacity
                    style={[styles.publishBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.88}
                >
                    {submitting ? (
                        <ActivityIndicator color={WHITE} />
                    ) : (
                        <>
                            <Text style={styles.publishText}>
                                {isEdit ? "Actualizar Proyecto" : "Publicar Proyecto"}
                            </Text>
                            <Rocket size={18} color={WHITE} />
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Estilos del VideoSlotCard ────────────────────────────────────────────────
const vStyles = StyleSheet.create({
    card: {
        backgroundColor: WHITE,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderRadius: 14,
        padding: 14,
        gap: 10,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cardTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: "700",
        color: TEXT,
    },
    doneRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    doneText: {
        flex: 1,
        fontSize: 12,
        color: GREEN,
    },
    uploadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    uploadingText: {
        flex: 1,
        fontSize: 12,
        color: MUTED,
    },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FEF2F2",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    cancelText: {
        fontSize: 12,
        fontWeight: "700",
        color: RED,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderStyle: "dashed",
        borderRadius: 10,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: BLUE,
    },
    linkRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    linkInput: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: TEXT,
    },
    linkConfirmBtn: {
        backgroundColor: BLUE,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    linkConfirmText: {
        fontSize: 13,
        fontWeight: "700",
        color: WHITE,
    },
});

// ── Estilos generales ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        gap: 12,
    },
    backBtn: { padding: 2 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: TEXT },
    dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
    dotActive: { backgroundColor: BLUE, width: 24, borderRadius: 4 },
    scrollContent: { padding: 20, paddingBottom: 100, gap: 24 },
    editNotice: {
        backgroundColor: "#FFFBEB",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FEF08A",
        padding: 12,
    },
    editNoticeText: { fontSize: 13, color: "#92400E" },
    section: { gap: 14 },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionLabel: { fontSize: 11, fontWeight: "800", color: MUTED, letterSpacing: 1.2 },
    addAuthorLink: { fontSize: 13, fontWeight: "700", color: BLUE },
    field: { gap: 6 },
    label: { fontSize: 14, fontWeight: "600", color: TEXT },
    input: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontSize: 14,
        color: TEXT,
    },
    textarea: { height: 110, paddingTop: 13 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    atSign: { fontSize: 16, color: MUTED, fontWeight: "600", paddingLeft: 4 },
    authorInput: { flex: 1 },
    removeBtn: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    },
    publishBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: BLUE,
        borderRadius: 14,
        paddingVertical: 16,
    },
    publishText: { fontSize: 16, fontWeight: "700", color: WHITE },
    uploadRow: { flexDirection: "row", gap: 12 },
    uploadBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 18,
        backgroundColor: WHITE,
    },
    uploadText: { fontSize: 12, fontWeight: "600", color: MUTED },
    urlField: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    urlInput: { flex: 1, fontSize: 14, color: TEXT },
    thumbnailWrapper: { width: 70, height: 70, borderRadius: 8, overflow: "hidden", position: "relative" },
    thumbnailImg: { width: "100%", height: "100%" },
    removeThumbnailBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 4 },
});
