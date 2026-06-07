import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLR, ROUTES } from "@/context/LRContext";
import { extractFromImage } from "@/services/aiService";
import { useColors } from "@/hooks/useColors";

interface Extracted {
  route: string | null;
  consignmentNo: string | null;
  invoiceNos: string[];
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, getNextLrNo } = useLR();
  const lottieRef = useRef<LottieView>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [editedRoute, setEditedRoute] = useState<string | null>(null);
  const [editedConsignment, setEditedConsignment] = useState("");
  const [editedInvoices, setEditedInvoices] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function pickImage(fromCamera: boolean) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let result;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan LRs.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        quality: 0.8,
        base64: true,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Photo library access is needed.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
        base64: true,
      });
    }

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setExtracted(null);
      await processImage(asset.base64 ?? "");
    }
  }

  async function processImage(base64: string) {
    if (!settings.openrouterApiKey) {
      Alert.alert(
        "API Key Required",
        "Please add your OpenRouter API key in Settings to use AI extraction."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await extractFromImage(base64, settings.openrouterApiKey);
      setExtracted(result);
      setEditedRoute(result.route);
      setEditedConsignment(result.consignmentNo ?? "");
      setEditedInvoices(result.invoiceNos.join(", "));
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Extraction Failed",
        "AI could not extract data from the image. Please enter details manually."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFillForm() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const routeId = editedRoute?.includes("Manesar →") ? 2 : 1;
    const invoiceList = editedInvoices
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    router.push({
      pathname: "/create-lr",
      params: {
        routeId: routeId.toString(),
        consignmentNo: editedConsignment,
        invoiceNos: invoiceList.join("|"),
      },
    });
  }

  function reset() {
    setImageUri(null);
    setExtracted(null);
    setEditedRoute(null);
    setEditedConsignment("");
    setEditedInvoices("");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface ?? colors.card,
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          AI Scan
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.accent + "22" },
          ]}
        >
          <Feather name="zap" size={12} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.accent }]}>
            Powered by AI
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!imageUri && !loading && (
          <View style={styles.uploadSection}>
            <View
              style={[
                styles.uploadBox,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              {Platform.OS !== "web" ? (
                <LottieView
                  ref={lottieRef}
                  source={require("@/assets/lottie/loading_hand.json")}
                  autoPlay
                  loop
                  style={styles.uploadLottie}
                />
              ) : (
                <View style={styles.uploadLottie}>
                  <Feather name="upload" size={48} color={colors.mutedForeground} />
                </View>
              )}
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                Upload LR Photo
              </Text>
              <Text
                style={[styles.uploadSubtitle, { color: colors.mutedForeground }]}
              >
                AI will extract route, consignment number, and invoice numbers
              </Text>
            </View>

            <View style={styles.pickOptions}>
              <TouchableOpacity
                style={[
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => pickImage(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#D4A843", "#A8782E"]}
                  style={styles.pickIcon}
                >
                  <Feather name="image" size={20} color="#0A1628" />
                </LinearGradient>
                <Text style={[styles.pickLabel, { color: colors.foreground }]}>
                  Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#6B4CC0", "#4A2E9A"]}
                  style={styles.pickIcon}
                >
                  <Feather name="camera" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.pickLabel, { color: colors.foreground }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>

            {!settings.openrouterApiKey && (
              <TouchableOpacity
                style={[
                  styles.apiKeyWarning,
                  { backgroundColor: colors.card, borderColor: "#D4A843" },
                ]}
                onPress={() => router.push("/(tabs)/settings")}
              >
                <Feather name="alert-circle" size={16} color="#D4A843" />
                <Text style={styles.apiKeyText}>
                  No API key — tap to configure in Settings
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && (
          <View style={styles.loadingSection}>
            {Platform.OS !== "web" ? (
              <LottieView
                source={require("@/assets/lottie/ai_loading.json")}
                autoPlay
                loop
                style={styles.loadingLottie}
              />
            ) : (
              <View style={styles.loadingLottie}>
                <Feather name="loader" size={48} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
              Analyzing Image...
            </Text>
            <Text
              style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}
            >
              AI is extracting LR details
            </Text>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={[styles.previewThumb, { borderColor: colors.border }]}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {!loading && imageUri && extracted && (
          <View style={styles.resultSection}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.previewImage, { borderColor: colors.border }]}
              resizeMode="contain"
            />

            <View
              style={[
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.resultHeader}>
                <Feather name="check-circle" size={18} color={colors.success ?? "#2D9E6E"} />
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                  Extraction Complete
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Route
                </Text>
                <View style={styles.routePicker}>
                  {["Chennai → Manesar", "Manesar → Chennai"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.routeOption,
                        {
                          backgroundColor:
                            editedRoute === r
                              ? colors.gold ?? colors.primary
                              : colors.muted,
                          borderColor:
                            editedRoute === r
                              ? colors.gold ?? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setEditedRoute(r)}
                    >
                      <Text
                        style={[
                          styles.routeOptionText,
                          {
                            color:
                              editedRoute === r ? "#0A1628" : colors.mutedForeground,
                          },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Consignment No
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={editedConsignment}
                  onChangeText={setEditedConsignment}
                  placeholder="Consignment number"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Invoice Numbers (comma separated)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={editedInvoices}
                  onChangeText={setEditedInvoices}
                  placeholder="e.g. TN2026000911-16, TN2026000912-17"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                />
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[
                  styles.resetBtn,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                onPress={reset}
              >
                <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fillBtn}
                onPress={handleFillForm}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#D4A843", "#A8782E"]}
                  style={styles.fillBtnGradient}
                >
                  <Feather name="edit-3" size={16} color="#0A1628" />
                  <Text style={styles.fillBtnText}>Fill Form</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  uploadSection: { gap: 16 },
  uploadBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  uploadLottie: { width: 150, height: 120, alignItems: "center", justifyContent: "center" },
  uploadTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  uploadSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  pickOptions: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  pickIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  apiKeyWarning: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  apiKeyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#D4A843",
    flex: 1,
  },
  loadingSection: { alignItems: "center", gap: 16, paddingVertical: 40 },
  loadingLottie: { width: 160, height: 160, alignItems: "center", justifyContent: "center" },
  loadingTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  loadingSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  previewThumb: {
    width: 120,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  resultSection: { gap: 16 },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  resultTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routePicker: { flexDirection: "row", gap: 8 },
  routeOption: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  routeOptionText: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  resultActions: { flexDirection: "row", gap: 12 },
  resetBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fillBtn: { flex: 2, borderRadius: 12, overflow: "hidden" },
  fillBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  fillBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0A1628",
  },
});
