module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@app": "./app",
            "@context": "./context",
            "@assets": "./assets"
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"]
        }
      ],
      "expo-router/babel"
    ]
  };
};
