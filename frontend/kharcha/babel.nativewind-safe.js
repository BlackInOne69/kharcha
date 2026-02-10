module.exports = function nativewindSafePreset(api, opts) {
  const presetFactory = require("react-native-css-interop/babel");
  const preset = presetFactory(api, opts) || {};
  const plugins = Array.isArray(preset.plugins) ? preset.plugins : [];

  return {
    ...preset,
    // Avoid hard dependency on react-native-worklets for web/dev stability.
    plugins: plugins.filter((entry) => {
      if (typeof entry === "string") {
        return entry !== "react-native-worklets/plugin";
      }
      if (Array.isArray(entry) && typeof entry[0] === "string") {
        return entry[0] !== "react-native-worklets/plugin";
      }
      return true;
    }),
  };
};
