import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
} from "react-native";
import { GraduationCap, Users } from "lucide-react-native";
import { Project } from "@/lib/types";
import { colors } from "@/constants/colors";
import { VideoThumb } from "@/components/VideoThumb";

interface Props {
    project: Project;
    onPress: (id: string) => void;
}

export function ProjectCard({ project, onPress }: Props) {
    const promedioLabel =
        project.promedio_general > 0 ? `${project.promedio_general}%` : "Pendiente";

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => onPress(project.id)}
            style={styles.container}
        >
            <View style={styles.imageContainer}>
                <VideoThumb
                    project={project}
                    style={styles.image}
                    fallbackUri={`https://picsum.photos/seed/${project.id}/400/300`}
                    playIconSize={18}
                />
                <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{project.category || "General"}</Text>
                </View>
            </View>
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                    {project.nombre}
                </Text>
                <View style={styles.metricsRow}>
                    <GraduationCap size={14} color={colors.accent} />
                    <Text style={styles.metricText}>{promedioLabel}</Text>
                    <View style={styles.metricDivider} />
                    <Users size={14} color={colors.mutedForeground} />
                    <Text style={[styles.metricText, { color: colors.mutedForeground }]}>
                        {project.communityRating}%
                    </Text>
                </View>
                <Text style={styles.author} numberOfLines={1}>
                    By {project.autores_correos?.length ? project.autores_correos.join(", ") : (project.authorName || "Desconocido")}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        marginBottom: 12,
    },
    imageContainer: {
        position: "relative",
    },
    image: {
        width: "100%",
        height: 160,
    },
    ytPlayOverlay: { position: "absolute", bottom: 10, right: 10 },
    ytPlayBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center",
    },
    categoryChip: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "rgba(255,255,255,0.92)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.foreground,
    },
    body: {
        padding: 14,
        gap: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.foreground,
    },
    metricsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    metricText: {
        fontSize: 12,
        fontWeight: "500",
        color: colors.accent,
    },
    metricDivider: {
        width: 1,
        height: 12,
        backgroundColor: colors.border,
        marginHorizontal: 4,
    },
    author: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
});
