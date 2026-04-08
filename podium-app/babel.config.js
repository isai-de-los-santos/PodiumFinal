module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        // NO agregar react-native-reanimated/plugin aquí — babel-preset-expo lo hace automáticamente
    };
};
