import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    StatusBar,
    RefreshControl,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Bell, Star } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/types";
import { VideoThumb } from "@/components/VideoThumb";

const BG     = "#F3F4F6";
const WHITE  = "#FFFFFF";
const BLUE   = "#2563EB";
const TEXT   = "#1E293B";
const MUTED  = "#64748B";
const BORDER = "#E2E8F0";

function getCategoryColor(cat: string): string {
    const map: Record<string, string> = {
        Design: "#7C3AED",
        Engineering: "#0891B2",
        Business: "#059669",
        Biology: "#16A34A",
        Computing: "#2563EB",
        Arts: "#DC2626",
        Science: "#D97706",
        Technology: "#0284C7",
        General: "#64748B",
    };
    return map[cat] || "#64748B";
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function FeaturedCard({ project, onPress }: { project: Project; onPress: () => void }) {
    const catColor = getCategoryColor(project.category || "General");
    return (
        <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.88}>
            <VideoThumb
                project={project}
                style={styles.featuredImg}
                fallbackUri={`https://picsum.photos/seed/${project.id}/300/200`}
                playIconSize={16}
            />
            {project.promedio_general > 0 && (
                <View style={styles.starBadge}>
                    <Star size={11} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.starText}>{Math.round(project.promedio_general)}</Text>
                </View>
            )}
            <View style={styles.featuredInfo}>
                <View style={[styles.catPill, { backgroundColor: `${catColor}18` }]}>
                    <Text style={[styles.catText, { color: catColor }]}>
                        {(project.category || "GENERAL").toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>{project.nombre}</Text>
                <View style={styles.authorRow}>
                    <Text style={styles.authorName} numberOfLines={1}>
                        By {project.autores_correos?.length ? project.autores_correos.join(", ") : (project.authorName || "Desconocido")}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function RecentItem({ project, onPress }: { project: Project; onPress: () => void }) {
    const catColor = getCategoryColor(project.category || "General");
    return (
        <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.9}>
            <VideoThumb
                project={project}
                style={styles.recentThumbWrap}
                fallbackUri={`https://picsum.photos/seed/${project.id}/400/220`}
                playIconSize={24}
            />
            <View style={styles.recentBody}>
                <View style={[styles.catPill, { backgroundColor: `${catColor}18`, alignSelf: "flex-start" }]}>
                    <Text style={[styles.catText, { color: catColor }]}>
                        {(project.category || "GENERAL").toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={2}>{project.nombre}</Text>
                {!!project.descripcion && (
                    <Text style={styles.recentDesc} numberOfLines={2}>{project.descripcion}</Text>
                )}
                <View style={styles.recentMeta}>
                    <Text style={[styles.byAuthor, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                        By {project.autores_correos?.length ? project.autores_correos.join(", ") : (project.authorName || "Desconocido")}
                    </Text>
                    <Text style={styles.timeText}>{timeAgo(project.fecha_creacion)}</Text>
                </View>
                <TouchableOpacity style={styles.viewBtn} onPress={onPress} activeOpacity={0.85}>
                    <Text style={styles.viewBtnText}>Ver Proyecto</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default function FeedEstudianteScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { projects, isLoading, loadProjects, searchQuery, setSearchQuery } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);

    // Simple timeout for the welcome banner to avoid LayoutAnimation crashes
    const [showWelcome, setShowWelcome] = useState(true);
    const welcomeOpacity = useRef(new Animated.Value(1)).current;

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

    useEffect(() => { loadProjects(); }, []);

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
        () => projects.filter((p) => p.promedio_general >= 80).slice(0, 6),
        [projects]
    );

    const firstName = user?.name?.split(" ")[0] || "Estudiante";
    const initial = user?.name?.charAt(0).toUpperCase() || "E";

    const goToDetail = (id: string) => router.push(`/(fendestudiante)/feed/${id}` as any);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Fixed header redesign */}
            <View style={styles.header}>
                <Text style={styles.headerBrandLabel}>Podium</Text>
                <TouchableOpacity style={styles.bellWrap} activeOpacity={0.7}>
                    <Bell size={22} color={TEXT} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
                }
            >
                {/* Welcome banner — animated, auto-hide after 3s */}
                {showWelcome && (
                    <Animated.View style={[styles.welcomeSection, { opacity: welcomeOpacity }]}>
                        <Text style={styles.welcomeText}>¡Hola, {firstName}!</Text>
                        <Text style={styles.welcomeSub}>Descubre los proyectos de tus compañeros</Text>
                    </Animated.View>
                )}

                {/* Search */}
                <View style={styles.searchWrap}>
                    <Search size={17} color={MUTED} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search projects or students"
                        placeholderTextColor={MUTED}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>

                {/* Featured Projects */}
                {!searchQuery.trim() && featured.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Featured Projects</Text>
                            <TouchableOpacity onPress={() => setVisibleCount(999)}>
                                <Text style={styles.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 14, paddingRight: 4 }}
                        >
                            {featured.map((p) => (
                                <FeaturedCard key={p.id} project={p} onPress={() => goToDetail(p.id)} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Projects */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {searchQuery.trim() ? "Results" : "Recent Projects"}
                    </Text>

                    {isLoading && projects.length === 0 ? (
                        <ActivityIndicator color={BLUE} style={{ marginTop: 32 }} />
                    ) : filtered.length === 0 ? (
                        <Text style={styles.emptyText}>No se encontraron proyectos</Text>
                    ) : (
                        <>
                            {filtered.slice(0, visibleCount).map((p) => (
                                <RecentItem key={p.id} project={p} onPress={() => goToDetail(p.id)} />
                            ))}
                            {visibleCount < filtered.length && (
                                <TouchableOpacity
                                    style={styles.loadMore}
                                    onPress={() => setVisibleCount((c) => c + 10)}
                                >
                                    <Text style={styles.loadMoreText}>Load more projects</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    headerBrandLabel: { fontSize: 22, fontWeight: "900", color: TEXT, letterSpacing: -0.5 },
    bellWrap: { padding: 4 },
    scrollContent: { paddingBottom: 110, gap: 0 },

    /* Welcome banner */
    welcomeSection: {
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6,
        backgroundColor: BLUE,
        marginBottom: 4,
        gap: 3,
    },
    welcomeText: { fontSize: 22, fontWeight: "800", color: WHITE },
    welcomeSub: { fontSize: 13, color: "rgba(255,255,255,0.82)" },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: WHITE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: `${BLUE}30`,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginTop: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    searchInput: { flex: 1, fontSize: 14, color: TEXT },
    section: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
    viewAll: { fontSize: 13, fontWeight: "600", color: BLUE },
    // Featured
    featuredCard: {
        width: 200,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: WHITE,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.09,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    featuredImg: { width: "100%", height: 130 },
    starBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#1E293B",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    starText: { fontSize: 12, fontWeight: "700", color: "#FBBF24" },
    featuredInfo: { padding: 12, gap: 6 },
    catPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    featuredTitle: { fontSize: 14, fontWeight: "700", color: TEXT, lineHeight: 20 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    authorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: `${MUTED}30`,
        alignItems: "center",
        justifyContent: "center",
    },
    authorDotText: { fontSize: 9, fontWeight: "700", color: MUTED },
    authorName: { fontSize: 12, color: MUTED, flex: 1 },
    // Recent — tarjeta vertical
    recentItem: {
        backgroundColor: WHITE,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    recentThumbWrap: { width: "100%", height: 190, overflow: "hidden" },
    recentBody: { padding: 14, gap: 8 },
    recentTitle: { fontSize: 17, fontWeight: "700", color: TEXT, lineHeight: 23 },
    recentDesc: { fontSize: 13, color: MUTED, lineHeight: 18 },
    recentMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    byAuthor: { fontSize: 12, color: MUTED },
    timeText: { fontSize: 11, color: MUTED },
    viewBtn: {
        backgroundColor: BLUE,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: "center",
        marginTop: 2,
    },
    viewBtnText: { fontSize: 14, fontWeight: "700", color: WHITE },
    loadMore: { alignItems: "center", paddingVertical: 18 },
    loadMoreText: { fontSize: 14, fontWeight: "600", color: BLUE },
    emptyText: { textAlign: "center", color: MUTED, paddingTop: 32, fontSize: 14 },
});
