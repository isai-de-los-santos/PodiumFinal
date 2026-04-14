import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    children: ReactNode;
}

export function GradientHeader({ children }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={["#D946A8", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { paddingTop: insets.top + 16 }]}
        >
            {/* Decorative circles */}
            <View style={styles.circleTopRight} />
            <View style={styles.circleBottomLeft} />
            {/* Content */}
            <View style={{ zIndex: 10 }}>{children}</View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
        position: "relative",
    },
    circleTopRight: {
        position: "absolute",
        top: -32,
        right: -32,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: "rgba(255,255,255,0.10)",
    },
    circleBottomLeft: {
        position: "absolute",
        bottom: 0,
        left: -16,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
});
