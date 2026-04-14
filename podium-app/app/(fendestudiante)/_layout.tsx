import React from "react";
import { Tabs, useRouter } from "expo-router";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, FolderOpen, Plus, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE   = "#2563EB";
const MUTED  = "#94A3B8";
const WHITE  = "#FFFFFF";
const BORDER = "#E2E8F0";

const TAB_ICONS: Record<string, (color: string) => React.ReactNode> = {
    "feed/index":    (c) => <Home      size={22} color={c} />,
    "mis-proyectos": (c) => <FolderOpen size={22} color={c} />,
    "perfil":        (c) => <User      size={22} color={c} />,
};

const TAB_LABELS: Record<string, string> = {
    "feed/index":    "Inicio",
    "mis-proyectos": "Proyectos",
    "perfil":        "Perfil",
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const visibleRoutes = state.routes.filter(
        (r) => r.name !== "crear" && r.name !== "feed/[id]"
    );

    const currentRouteName = state.routes[state.index]?.name;
    const isOnHome = currentRouteName === "feed/index";

    /* Bottom padding: always at least 12px, plus safe-area inset */
    const bottomPad = Math.max(insets.bottom, 0) + 12;

    return (
        <View>
            {/* Tab bar — NO fixed height; let paddingTop + content + paddingBottom flex it */}
            <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
                {visibleRoutes.map((route) => {
                    const isFocused = state.routes[state.index].name === route.name;
                    const color = isFocused ? BLUE : MUTED;
                    const label = TAB_LABELS[route.name] ?? route.name;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.7}
                            style={styles.tabItem}
                            accessibilityRole="button"
                            accessibilityLabel={label}
                        >
                            {TAB_ICONS[route.name]?.(color)}
                            <Text style={[styles.tabLabel, { color, fontWeight: isFocused ? "700" : "400" }]}>
                                {label}
                            </Text>
                            {/* Small active dot under label */}
                            {isFocused && <View style={styles.activeDot} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* FAB — only on Home tab */}
            {isOnHome && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: bottomPad + 62 }]}
                    onPress={() => router.push("/(fendestudiante)/crear" as any)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Crear nuevo proyecto"
                >
                    <Plus size={28} color={WHITE} strokeWidth={2.5} />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function FendEstudianteLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="feed/index" />
            <Tabs.Screen name="mis-proyectos" />
            <Tabs.Screen name="perfil" />
            <Tabs.Screen name="crear"     options={{ href: null }} />
            <Tabs.Screen name="feed/[id]" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        backgroundColor: WHITE,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingTop: 10,        /* no height — content + padding defines height */
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        paddingBottom: 2,
    },
    tabLabel: { fontSize: 11 },
    activeDot: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: BLUE,
        marginTop: 2,
    },
    fab: {
        position: "absolute",
        right: 20,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: BLUE,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: BLUE,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
});
