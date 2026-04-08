import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    FlatList,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Sparkles } from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { Project } from "@/lib/types";

const BG    = "#F3F4F6";
const WHITE = "#FFFFFF";
const BLUE  = "#2563EB";

// Removed UIManager Layout animation since it crashes natively on Android

export default function FeedScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { projects, isLoading, loadProjects, searchQuery, setSearchQuery } = useApp();
    const [refreshing, setRefreshing] = useState(false);

    // Simple timeout for the welcome banner
    const [showWelcome, setShowWelcome] = useState(true);
    const welcomeOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(welcomeOpacity, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            }).start(() => {
                setShowWelcome(false);
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return projects;
        return projects.filter(
            (p) =>
                p.nombre.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.authorName?.toLowerCase().includes(q)
        );
    }, [projects, searchQuery]);

    const featured = useMemo(
        () => projects.filter((p) => p.promedio_general >= 90).slice(0, 3),
        [projects]
    );

    const firstName = user?.name?.split(" ")[0] || "Usuario";
    const initial   = user?.name?.charAt(0).toUpperCase() || "U";

    const header = (
        <View>
            <GradientHeader>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        {/* Welcome animated — visible solo 3s */}
                        {showWelcome ? (
                            <Animated.View style={{ opacity: welcomeOpacity }}>
                                <Text style={styles.welcome}>Bienvenido/a,</Text>
                                <Text style={styles.userName}>{firstName}</Text>
                            </Animated.View>
                        ) : (
                            <Text style={styles.userName}>Proyectos</Text>
                        )}
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                </View>
            </GradientHeader>

            <View style={styles.content}>
                {/* Search — blanco sobre fondo gris = profundidad */}
                <View style={styles.searchWrap}>
                    <Search size={18} color={BLUE} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar proyectos..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>

                {/* Destacados */}
                {!searchQuery.trim() && featured.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Sparkles size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Destacados</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 16, paddingRight: 20 }}
                        >
                            {featured.map((p) => (
                                <View key={p.id} style={{ width: 260 }}>
                                    <ProjectCard
                                        project={p}
                                        onPress={() => router.push(`/(fenddocente)/feed/${p.id}`)}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <Text style={styles.sectionTitle}>
                    {searchQuery.trim() ? "Resultados" : "Recientes"}
                </Text>
            </View>
        </View>
    );

    if (isLoading && projects.length === 0) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                {header}
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
                ListHeaderComponent={header}
                renderItem={({ item }) => (
                    <ProjectCard
                        project={item}
                        onPress={() => router.push(`/(fenddocente)/feed/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No se encontraron proyectos</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    welcome:  { fontSize: 13, color: "rgba(250,250,250,0.8)", marginBottom: 2 },
    userName: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    avatarText: { fontSize: 15, fontWeight: "700", color: "#FAFAFA" },
    content: { paddingHorizontal: 20, paddingTop: 20, gap: 18 },
    searchWrap: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: WHITE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: `${BLUE}30`,
        paddingHorizontal: 14, paddingVertical: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.foreground },
    section: { gap: 12 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    list: { paddingHorizontal: 20, paddingBottom: 100, gap: 0 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", paddingTop: 40 },
    emptyText: { fontSize: 14, color: colors.mutedForeground },
});
