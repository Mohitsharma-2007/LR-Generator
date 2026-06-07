import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, lrs } = useLR();

  const [senderEmail, setSenderEmail] = useState(settings.senderEmail);
  const [appPassword, setAppPassword] = useState(settings.googleAppPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState(settings.openrouterApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [saving, setSaving] = useState(false);

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
        <SectionHeader title="Gmail Configuration" />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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

          <Text
            style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}
          >
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
              style={[
                styles.eyeBtn,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveEmailConfig}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#D4A843", "#A8782E"]}
              style={styles.saveBtnGradient}
            >
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save Configuration"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <SectionHeader title="Recipient Emails" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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
              style={[
                styles.addBtn,
                { backgroundColor: colors.gold ?? colors.primary },
              ]}
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
                style={[
                  styles.chip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Feather name="mail" size={13} color={colors.mutedForeground} />
                <Text
                  style={[styles.chipText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
                <TouchableOpacity onPress={() => removeEmail(email)}>
                  <Feather name="x" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <SectionHeader title="AI Configuration" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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
              style={[
                styles.eyeBtn,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather
                name={showApiKey ? "eye-off" : "eye"}
                size={16}
                color={colors.mutedForeground}
              />
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
            <LinearGradient
              colors={["#D4A843", "#A8782E"]}
              style={styles.saveBtnGradient}
            >
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save API Key"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <SectionHeader title="Vehicle Management" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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
              style={[
                styles.addBtn,
                { backgroundColor: colors.gold ?? colors.primary },
              ]}
              onPress={addVehicle}
            >
              <Feather name="plus" size={18} color="#0A1628" />
            </TouchableOpacity>
          </View>

          {settings.vehicles.map((v) => (
            <View
              key={v}
              style={[
                styles.chip,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather name="truck" size={13} color={colors.mutedForeground} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>
                {v}
              </Text>
              <TouchableOpacity onPress={() => removeVehicle(v)}>
                <Feather name="x" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <SectionHeader title="About" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.aboutRow}>
            <Image
              source={require("@/assets/logo/maha_laxmi.png")}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
                LR Generator
              </Text>
              <Text
                style={[styles.aboutSubtitle, { color: colors.mutedForeground }]}
              >
                Maha Laxmi Transport Co.
              </Text>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
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
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#0A1628",
  },
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
  chipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptyChip: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutLogo: { width: 52, height: 52, borderRadius: 26 },
  aboutTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  aboutSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  aboutVersion: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
