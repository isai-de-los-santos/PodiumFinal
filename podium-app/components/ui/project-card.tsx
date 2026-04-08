import { View, Text, TouchableOpacity, Image } from "react-native";
import { GraduationCap } from "lucide-react-native";
import { ProyectoUI } from "@/lib/api";

interface ProjectCardProps {
    project: ProyectoUI;
    onPress: (id: string) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress(project.id)}
            className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm mb-4"
        >
            <View className="relative h-40 w-full overflow-hidden">
                {project.imagenUrl ? (
                    <Image
                        source={{ uri: project.imagenUrl }}
                        className="h-full w-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="h-full w-full bg-border items-center justify-center">
                        <Text className="text-muted-foreground">Sin portada</Text>
                    </View>
                )}
                <View className="absolute left-3 top-3 rounded-lg bg-card/90 px-2.5 py-1">
                    <Text className="text-xs font-medium text-foreground">
                        {project.grupoId || "Sin grupo"}
                    </Text>
                </View>
            </View>

            <View className="flex-col gap-2 p-4">
                <Text className="text-base font-semibold leading-tight text-foreground" numberOfLines={2}>
                    {project.nombre}
                </Text>

                <View className="flex-row items-center gap-4 mt-1">
                    <View className="flex-row items-center gap-1.5">
                        <GraduationCap className="text-accent" size={16} />
                        <Text className="text-xs font-medium text-foreground">
                            {(project.calificacion ?? 0) > 0 ? `${project.calificacion}/100` : "Pendiente"}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className={`h-2 w-2 rounded-full ${project.estado === 'aprobado' ? 'bg-success' : project.estado === 'rechazado' ? 'bg-destructive' : 'bg-star'}`} />
                        <Text className="text-xs font-medium text-foreground capitalize">
                            {project.estado}
                        </Text>
                    </View>
                </View>

                <Text className="text-xs text-muted-foreground mt-1">
                    por {project.alumnoNombre}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
