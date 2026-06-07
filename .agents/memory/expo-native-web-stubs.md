---
name: Expo native-only modules on web
description: expo-media-library and expo-local-authentication crash on web even when gated with Platform.OS checks or .native.ts splitting — need metro resolver stubs.
---

**Rule:** Any Expo package that requires a native module (e.g. `ExpoMediaLibraryNext`, `ExpoLocalAuthentication`) will crash when Metro bundles for web, even if all code paths are guarded with `Platform.OS !== 'web'`. Static imports are included in the web bundle regardless of runtime guards.

**Why:** Metro resolves static `import` statements at bundle time before any runtime platform checks run. Platform-specific `.native.ts` files work for your own code, but when a native-only package itself has no web shim, Metro errors on load.

**How to apply:** In `metro.config.js`, add a `resolveRequest` that redirects the problematic package to a stub (`stubs/nativeModuleStub.js` exporting `module.exports = {}`) when `platform === 'web'`:

```js
const NATIVE_ONLY_MODULES = ["expo-media-library", "expo-local-authentication"];
const stubPath = path.resolve(__dirname, "stubs/nativeModuleStub.js");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && NATIVE_ONLY_MODULES.some(m => moduleName === m || moduleName.startsWith(m + "/"))) {
    return { filePath: stubPath, type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};
```
