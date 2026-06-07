import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useLR } from "@/context/LRContext";
import { useColors } from "@/hooks/useColors";

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[sectionStyles.title, { color: colors.mutedForeground }]}>
      {title}
    </Text>
  );
}

const sectionStyles = StyleSheet.create({
  title: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 10,
  },
});

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

function PinSetupModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (pin: string) => void;
}) {
  const colors = useColors();
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const current = step === "enter" ? first : second;
  const setCurrent = step === "enter" ? setFirst : setSecond;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function pressKey(key: string) {
    setError("");
    if (key === "DEL") {
      setCurrent((p) => p.slice(0, -1));
      return;
    }
    if (current.length >= 4) return;
    const next = current + key;
    setCurrent(next);

    if (next.length === 4) {
      if (step === "enter") {
        setTimeout(() => {
          setStep("confirm");
          setSecond("");
        }, 120);
      } else {
        if (next === first) {
          onSave(first);
          reset();
        } else {
          setError("PINs don't match. Start over.");
          shake();
          setTimeout(() => {
            setFirst("");
            setSecond("");
            setStep("enter");
            setError("");
          }, 900);
        }
      }
    }
  }

  function reset() {
    setFirst("");
    setSecond("");
    setStep("enter");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  const dots = step === "enter" ? first : second;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pinStyles.overlay}>
        <View style={[pinStyles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={pinStyles.handle} />
          <Text style={[pinStyles.title, { color: colors.foreground }]}>
            {step === "enter" ? "Set App PIN" : "Confirm PIN"}
          </Text>
          <Text style={[pinStyles.sub, { color: error ? "#E05C5C" : colors.mutedForeground }]}>
            {error || (step === "enter" ? "Enter a 4-digit PIN" : "Re-enter your PIN to confirm")}
          </Text>

          <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  pinStyles.dot,
                  { borderColor: colors.gold ?? colors.primary },
                  dots.length > i && { backgroundColor: colors.gold ?? colors.primary },
                ]}
              />
            ))}
          </Animated.View>

          <View style={pinStyles.keypad}>
            {PIN_KEYS.map((key, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  pinStyles.key,
                  { borderColor: "rgba(212,168,67,0.22)", backgroundColor: "rgba(212,168,67,0.09)" },
                  key === "" && pinStyles.keyGhost,
                ]}
                onPress={() => key && pressKey(key)}
                activeOpacity={0.65}
                disabled={key === ""}
              >
                {key === "DEL" ? (
                  <Feather name="delete" size={20} color={colors.gold ?? colors.primary} />
                ) : (
                  <Text style={[pinStyles.keyText, { color: colors.foreground }]}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleClose} style={pinStyles.cancelBtn}>
            <Text style={[pinStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, lrs } = useLR();
  const {
    biometricEnabled,
    appPin,
    hasBiometrics,
    setBiometricEnabled,
    updatePin,
    removePin,
  } = useAuth();

  const [senderEmail, setSenderEmail] = useState(settings.senderEmail);
  const [appPassword, setAppPassword] = useState(settings.googleAppPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState(settings.openrouterApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function saveEmailConfig() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    await updateSettings({
      senderEmail: senderEmail.trim(),
      googleAppPassword: appPassword,
      openrouterApiKey: apiKey.trim(),
    });
    setSaving(false);
    Alert.alert("Saved", "Settings saved successfully.");
  }

  function addEmail() {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      Alert.alert("Invalid", "Please enter a valid email address.");
      return;
    }
    if (settings.emailIds.includes(newEmail.trim())) {
      Alert.alert("Duplicate", "This email is already added.");
      return;
    }
    updateSettings({ emailIds: [...settings.emailIds, newEmail.trim()] });
    setNewEmail("");
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function removeEmail(email: string) {
    Alert.alert("Remove Email", `Remove ${email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          updateSettings({
            emailIds: settings.emailIds.filter((e) => e !== email),
          }),
      },
    ]);
  }

  function addVehicle() {
    if (!newVehicle.trim()) return;
    if (settings.vehicles.includes(newVehicle.toUpperCase().trim())) {
      Alert.alert("Duplicate", "This vehicle is already added.");
      return;
    }
    updateSettings({
      vehicles: [...settings.vehicles, newVehicle.toUpperCase().trim()],
    });
    setNewVehicle("");
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function removeVehicle(v: string) {
    Alert.alert("Remove Vehicle", `Remove ${v}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          updateSettings({
            vehicles: settings.vehicles.filter((veh) => veh !== v),
          }),
      },
    ]);
  }

  async function handlePinSave(pin: string) {
    await updatePin(pin);
    setShowPinSetup(false);
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("PIN Set", "App PIN has been set successfully.");
  }

  async function handleRemovePin() {
    Alert.alert("Remove PIN", "Remove the app PIN? The app will no longer require a PIN to open.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePin();
          Alert.alert("PIN Removed", "App PIN has been removed.");
        },
      },
    ]);
  }

  async function handleBiometricToggle(v: boolean) {
    if (!hasBiometrics && v) {
      Alert.alert("Not Available", "No fingerprint/biometric enrolled on this device.");
      return;
    }
    await setBiometricEnabled(v);
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

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
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/logo/maha_laxmi.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Settings
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {lrs.length} LR{lrs.length !== 1 ? "s" : ""} saved
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security */}
        {Platform.OS !== "web" && (
          <>
            <SectionHeader title="Security" />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {hasBiometrics && (
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Feather name="shield" size={16} color={colors.gold ?? colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                        Fingerprint Lock
                      </Text>
                      <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                        {biometricEnabled ? "Enabled — tap fingerprint to unlock" : "Disabled"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.border, true: colors.gold ?? colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              )}

              <View style={[styles.toggleRow, hasBiometrics && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
                <View style={styles.toggleInfo}>
                  <Feather name="lock" size={16} color={colors.gold ?? colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>App PIN</Text>
                    <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                      {appPin ? "PIN is set · 4-digit code" : "No PIN configured"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.smallBtn, { borderColor: colors.gold ?? colors.primary }]}
                  onPress={() => setShowPinSetup(true)}
                >
                  <Text style={[styles.smallBtnText, { color: colors.gold ?? colors.primary }]}>
                    {appPin ? "Change" : "Set PIN"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!!appPin && (
                <TouchableOpacity
                  style={[styles.removePinBtn, { borderColor: colors.destructive }]}
                  onPress={handleRemovePin}
                >
                  <Feather name="unlock" size={14} color={colors.destructive} />
                  <Text style={[styles.removePinText, { color: colors.destructive }]}>
                    Remove PIN
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Gmail */}
        <SectionHeader title="Gmail Configuration" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Sender Gmail Address
          </Text>
          <TextInput
            style={inputStyle}
            value={senderEmail}
            onChangeText={setSenderEmail}
            placeholder="your@gmail.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            Google App Password
          </Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={appPassword}
              onChangeText={setAppPassword}
              placeholder="16-char app password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              style={[styles.eyeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveEmailConfig}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#D4A843", "#A8782E"]} style={styles.saveBtnGradient}>
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Configuration"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recipient Emails */}
        <SectionHeader title="Recipient Emails" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.addRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Add email address"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.gold ?? colors.primary }]}
              onPress={addEmail}
            >
              <Feather name="plus" size={18} color="#0A1628" />
            </TouchableOpacity>
          </View>

          {settings.emailIds.length === 0 ? (
            <Text style={[styles.emptyChip, { color: colors.mutedForeground }]}>
              No recipient emails added
            </Text>
          ) : (
            settings.emailIds.map((email) => (
              <View
                key={email}
                style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="mail" size={13} color={colors.mutedForeground} />
                <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                  {email}
                </Text>
                <TouchableOpacity onPress={() => removeEmail(email)}>
                  <Feather name="x" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* AI */}
        <SectionHeader title="AI Configuration" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            OpenRouter API Key
          </Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-or-..."
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowApiKey((p) => !p)}
              style={[styles.eyeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name={showApiKey ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Get a free key at openrouter.ai — used for AI photo extraction
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveEmailConfig}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#D4A843", "#A8782E"]} style={styles.saveBtnGradient}>
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save API Key"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Vehicles */}
        <SectionHeader title="Vehicle Management" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.addRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={newVehicle}
              onChangeText={setNewVehicle}
              placeholder="Vehicle No (e.g. UP16PT9444)"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.gold ?? colors.primary }]}
              onPress={addVehicle}
            >
              <Feather name="plus" size={18} color="#0A1628" />
            </TouchableOpacity>
          </View>

          {settings.vehicles.map((v) => (
            <View
              key={v}
              style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="truck" size={13} color={colors.mutedForeground} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{v}</Text>
              <TouchableOpacity onPress={() => removeVehicle(v)}>
                <Feather name="x" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Image
              source={require("@/assets/logo/maha_laxmi.png")}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitle, { color: colors.foreground }]}>LR Generator</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.mutedForeground }]}>
                Maha Laxmi Transport Co.
              </Text>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <PinSetupModal
        visible={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSave={handlePinSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scrollContent: { paddingHorizontal: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  passwordRow: { flexDirection: "row", gap: 8 },
  eyeBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0A1628" },
  addRow: { flexDirection: "row", gap: 8 },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  chipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyChip: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutLogo: { width: 52, height: 52, borderRadius: 26 },
  aboutTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  aboutSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  aboutVersion: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  removePinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  removePinText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

const pinStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24, textAlign: "center" },
  dots: { flexDirection: "row", gap: 18, marginBottom: 28 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 264, gap: 10, marginBottom: 20 },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  keyText: { fontSize: 24, fontFamily: "Inter_400Regular" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 24 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
