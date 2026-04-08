import { View } from "react-native";
import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";

// Replicamos el gradiente exacto ("bg-gradient-to-r from-gradient-start to-gradient-end") de fendv0
export function GradientHeader({ children }: { children?: ReactNode }) {
    return (
        <LinearGradient
            colors={["#DB2777", "#9333EA"]} // de rosa magentoso a púrpura
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="relative w-full overflow-hidden rounded-b-[32px] px-6 pb-10 pt-16"
        >
            {/* Decorative circles usando clases similares a fendv0 */}
            <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <View className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />
            <View className="relative z-10">{children}</View>
        </LinearGradient>
    );
}
