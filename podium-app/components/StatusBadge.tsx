import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Clock, CheckCircle2, XCircle } from "lucide-react-native";

type Status = "pendiente" | "aprobado" | "rechazado";

const config: Record<Status, { bg: string; text: string; Icon: any }> = {
    pendiente: { bg: "#FEF3C7", text: "#92400E", Icon: Clock },
    aprobado: { bg: "#D1FAE5", text: "#065F46", Icon: CheckCircle2 },
    rechazado: { bg: "#FEE2E2", text: "#991B1B", Icon: XCircle },
};

const labels: Record<Status, string> = {
    pendiente: "Pendiente",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
};

interface Props {
    status: string;
}

export function StatusBadge({ status }: Props) {
    const key = (status?.toLowerCase() as Status) || "pendiente";
    const { bg, text, Icon } = config[key] || config.pendiente;

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Icon size={12} color={text} />
            <Text style={[styles.text, { color: text }]}>{labels[key] || status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    text: {
        fontSize: 11,
        fontWeight: "600",
    },
});
