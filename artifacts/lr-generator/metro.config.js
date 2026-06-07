const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const NATIVE_ONLY_MODULES = ["expo-media-library", "expo-local-authentication"];
const stubPath = path.resolve(__dirname, "stubs/nativeModuleStub.js");

const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    NATIVE_ONLY_MODULES.some(
      (m) => moduleName === m || moduleName.startsWith(m + "/")
    )
  ) {
    return { filePath: stubPath, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
