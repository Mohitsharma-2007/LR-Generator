---
name: expo-file-system v16+ API change
description: expo-file-system v16+ switched to a class-based API; the old functional API lives at expo-file-system/legacy.
---

**Rule:** `expo-file-system` v16+ (the version that ships with Expo SDK 54) exports a new class-based API (`File`, `Directory`, `Paths`). The familiar `documentDirectory`, `getInfoAsync`, `makeDirectoryAsync`, `copyAsync`, `readAsStringAsync`, `EncodingType` etc. are now in the legacy import.

**Why:** Breaking API change in the package. Default import path changed to new class-based API.

**How to apply:** Use `import * as FileSystem from "expo-file-system/legacy"` to get the old functional API unchanged.
