import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Buscar proyectos..." }: SearchBarProps) {
    return (
        <View className="relative w-full">
            <View className="absolute left-4 top-1/2 -translate-y-[10px] z-10">
                <Search {...({ color: "#64748B", size: 20 } as any)} />
            </View>
            <TextInput
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-sm text-foreground"
                placeholder={placeholder}
                placeholderTextColor="#8B8BAA"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    );
}
