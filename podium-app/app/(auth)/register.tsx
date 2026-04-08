import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/colors";
import { Role } from "@/lib/types";

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();
    const [role, setRole] = useState<"estudiante" | "maestro">("estudiante");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
            setError("Completa todos los campos.");
            return;
        }
        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setError("");
        setLoading(true);
        const result = await register(name.trim(), email.trim(), password, role);
        setLoading(false);
        if (result.ok) {
            setSuccess("✅ Cuenta creada exitosamente. Ahora inicia sesión.");
            setTimeout(() => router.replace("/(auth)/login"), 1800);
        } else {
            setError(result.error || "No se pudo crear la cuenta. Intenta con otro correo.");
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <GradientHeader>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backBtn}
                            activeOpacity={0.8}
                        >
                            <ArrowLeft size={18} color="#FAFAFA" />
                            <Text style={styles.backText}>Regresar</Text>
                        </TouchableOpacity>
                        <Text style={styles.brand}>Podium</Text>
                        <Text style={styles.brandSub}>Crea tu cuenta</Text>
                    </GradientHeader>

                    <View style={styles.body}>
                        <Text style={styles.title}>Registro</Text>

                        {/* Rol selector */}
                        <View style={styles.roleRow}>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === "estudiante" && styles.roleBtnActive]}
                                onPress={() => setRole("estudiante")}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[styles.roleText, role === "estudiante" && styles.roleTextActive]}
                                >
                                    Estudiante
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === "maestro" && styles.roleBtnActive]}
                                onPress={() => setRole("maestro")}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[styles.roleText, role === "maestro" && styles.roleTextActive]}
                                >
                                    Docente
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            {/* Name */}
                            <View style={styles.inputWrap}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nombre completo"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputWrap}>
                                <Mail size={20} color={colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Correo electrónico"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputWrap}>
                                <Lock size={20} color={colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Contraseña"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                />
                                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                    {showPass ? (
                                        <EyeOff size={20} color={colors.mutedForeground} />
                                    ) : (
                                        <Eye size={20} color={colors.mutedForeground} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputWrap}>
                                <Lock size={20} color={colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Confirmar contraseña"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? (
                                        <EyeOff size={20} color={colors.mutedForeground} />
                                    ) : (
                                        <Eye size={20} color={colors.mutedForeground} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {success ? <Text style={styles.success}>{success}</Text> : null}
                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.btn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.btnText}>Crear cuenta</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                                <Text style={styles.footerLink}>Iniciar sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    backText: { fontSize: 14, color: "rgba(250,250,250,0.9)" },
    brand: { fontSize: 28, fontWeight: "700", color: "#FAFAFA", marginBottom: 4 },
    brandSub: { fontSize: 13, color: "rgba(250,250,250,0.8)" },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, marginBottom: 16 },
    roleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    roleBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.input,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: colors.card,
    },
    roleBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    roleTextActive: { color: colors.primaryForeground },
    form: { gap: 12 },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.input,
        backgroundColor: colors.card,
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: colors.foreground },
    success: { fontSize: 13, color: "#16A34A", fontWeight: "600" },
    error: { fontSize: 13, color: colors.destructive },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 8,
    },
    btnText: { color: colors.primaryForeground, fontWeight: "600", fontSize: 15 },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 24,
        paddingBottom: 40,
    },
    footerText: { fontSize: 14, color: colors.mutedForeground },
    footerLink: { fontSize: 14, fontWeight: "600", color: colors.accent },
});
