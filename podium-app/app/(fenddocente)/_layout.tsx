import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Home, User } from "lucide-react-native";
import { colors } from "@/constants/colors";

export default function FendDocenteLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            <Tabs.Screen
                name="feed/index"
                options={{
                    title: "Proyectos",
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
            {/* Rutas ocultas del tab bar */}
            <Tabs.Screen name="feed/[id]" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
        paddingBottom: 24,
        height: 80,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
    },
    tabLabel: { fontSize: 11, fontWeight: "500" },
    tabItem: { paddingTop: 4 },
});
