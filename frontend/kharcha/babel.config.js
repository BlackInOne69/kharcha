module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "./babel.nativewind-safe.js"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
