import React, { useState } from "react";
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";

interface ImageViewerProps {
    uri: string;
    thumbnailStyle?: object;
}

function transformDriveUrl(url: string): string {
    const slash = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (slash?.[1]) {
        return `https://drive.google.com/uc?export=view&id=${slash[1]}`;
    }
    try {
        const uriObj = new URL(url);
        const id = uriObj.searchParams.get("id");
        if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    } catch { }
    return url;
}

export function ImageViewer({ uri, thumbnailStyle }: ImageViewerProps) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const { width, height } = useWindowDimensions();

    const isDrive = uri.toLowerCase().includes("drive.google.com");
    const imageUri = isDrive ? transformDriveUrl(uri) : uri;

    return (
        <>
            {/* Thumbnail tappable */}
            <TouchableOpacity
                onPress={() => setVisible(true)}
                activeOpacity={0.85}
            >
                <Image
                    source={{ uri: imageUri }}
                    style={[styles.thumb, thumbnailStyle]}
                    resizeMode="cover"
                />
            </TouchableOpacity>

            {/* Full-screen modal viewer */}
            <Modal
                visible={visible}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
                statusBarTranslucent
            >
                <View style={styles.container}>
                    <StatusBar hidden />

                    {loading && (
                        <ActivityIndicator
                            size="large"
                            color="#fff"
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    <Image
                        source={{ uri: imageUri }}
                        style={{ width, height }}
                        resizeMode="contain"
                        onLoad={() => setLoading(false)}
                        onError={() => setLoading(false)}
                    />

                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setVisible(false)}
                        activeOpacity={0.85}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <View style={styles.closeBtnBg}>
                            <X size={22} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    thumb: {
        width: 110,
        height: 80,
        borderRadius: 10,
        marginRight: 8,
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtn: {
        position: "absolute",
        top: 52,
        right: 18,
    },
    closeBtnBg: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(0,0,0,0.65)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
});
