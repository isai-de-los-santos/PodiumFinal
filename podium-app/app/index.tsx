import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { colors } from "@/constants/colors";

export default function Index() {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

    // Redirigir al grupo correcto según el rol
    if (user?.role === "admin") return <Redirect href="/(fendadmin)/home" />;
    if (user?.role === "teacher") return <Redirect href="/(fenddocente)/feed" />;
    return <Redirect href="/(fendestudiante)/feed" />;
}
