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
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/colors";

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Por favor completa todos los campos.");
            return;
        }
        setError("");
        setLoading(true);
        const result = await login(email.trim(), password);
        setLoading(false);
        if (result.ok) {
            router.replace("/");
        } else {
            setError(result.error || "Credenciales incorrectas. Intenta de nuevo.");
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
                        <Text style={styles.brand}>Podium</Text>
                        <Text style={styles.brandSub}>Tu plataforma académica</Text>
                    </GradientHeader>

                    <View style={styles.body}>
                        <Text style={styles.title}>Iniciar Sesión</Text>
                        <Text style={styles.subtitle}>Ingresa a tu cuenta para continuar</Text>

                        <View style={styles.form}>
                            {/* Email */}
                            <View style={[styles.inputWrap, emailFocused && styles.inputFocused]}>
                                <Mail size={20} color={colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Correo electrónico"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                            </View>

                            {/* Password */}
                            <View style={[styles.inputWrap, passFocused && styles.inputFocused]}>
                                <Lock size={20} color={colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Contraseña"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                />
                                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                                    {showPass ? (
                                        <EyeOff size={20} color={colors.mutedForeground} />
                                    ) : (
                                        <Eye size={20} color={colors.mutedForeground} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[styles.btn, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.btnText}>Iniciar Sesión</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                                <Text style={styles.footerLink}>Crear cuenta</Text>
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
    brand: {
        fontSize: 32,
        fontWeight: "700",
        color: "#FAFAFA",
        marginBottom: 4,
    },
    brandSub: {
        fontSize: 14,
        color: "rgba(250,250,250,0.8)",
    },
    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.foreground,
    },
    subtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 6,
        marginBottom: 32,
    },
    form: {
        gap: 14,
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.input,
        backgroundColor: colors.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: colors.accent,
        borderWidth: 2,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: colors.foreground,
    },
    eyeBtn: {
        padding: 2,
    },
    error: {
        fontSize: 13,
        color: colors.destructive,
    },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 8,
    },
    btnText: {
        color: colors.primaryForeground,
        fontWeight: "600",
        fontSize: 15,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 32,
        paddingBottom: 40,
    },
    footerText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
    },
});
