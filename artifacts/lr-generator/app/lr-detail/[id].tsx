import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLR, ROUTES, COMPANY } from "@/context/LRContext";
import { generatePDF, sharePDF, generateLRHtml } from "@/services/pdfService";
import { sendEmail } from "@/services/emailService";
import { useColors } from "@/hooks/useColors";

export default function LRDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLRById, deleteLR, settings } = useLR();
  const sentRef = useRef<LottieView>(null);

  const lr = getLRById(id);
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!lr) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Feather name="file" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
          LR not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.gold ?? colors.primary }]}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lrData = lr;
  const route = ROUTES[lrData.routeId];
  const total = lrData.frightCharge;
  const advance = Math.round(total * 0.9);
  const balance = total - advance;
  const html = generateLRHtml(lrData);

  async function handleShare() {
    if (Platform.OS === "web") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneratingPDF(true);
    try {
      const uri = await generatePDF(lrData);
      await sharePDF(uri, lrData.lrNo);
    } catch {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setGeneratingPDF(false);
    }
  }

  function toggleEmail(email: string) {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  async function handleSendEmail() {
    if (selectedEmails.length === 0) {
      Alert.alert("No Recipients", "Please select at least one email address.");
      return;
    }
    if (!settings.senderEmail || !settings.googleAppPassword) {
      Alert.alert(
        "Email Not Configured",
        "Please configure your Gmail and App Password in Settings."
      );
      return;
    }

    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSendingEmail(true);
    setShowEmailPicker(false);

    try {
      await sendEmail({
        to: selectedEmails,
        subject: `LR ${lrData.lrNo} - Maha Laxmi Transport Co.`,
        body: `Please find the attached Lorry Receipt ${lrData.lrNo} for your reference.\n\nDate: ${lrData.date}\nRoute: ${route.name}\nVehicle: ${lrData.vehicleNo}\nFreight: ₹${lrData.frightCharge.toLocaleString("en-IN")}\n\nRegards,\nMaha Laxmi Transport Co.`,
        senderEmail: settings.senderEmail,
        appPassword: settings.googleAppPassword,
      });

      setShowSent(true);
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => setShowSent(false), 2500);
    } catch (e) {
      Alert.alert(
        "Email Failed",
        `Could not send email: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setSendingEmail(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete LR", `Delete ${lrData.lrNo}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLR(lrData.id);
          router.replace("/(tabs)/lrs");
        },
      },
    ]);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.gold ?? colors.primary }]}>
            {lr.lrNo}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {lr.date} · {route.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/create-lr?edit=${lr.id}`)}
          style={styles.editBtn}
        >
          <Feather name="edit-2" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={14} color={colors.mutedForeground} />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Vehicle</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{lr.vehicleNo}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="hash" size={14} color={colors.mutedForeground} />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Consignment</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{lr.consignmentNo}</Text>
          </View>
          <View style={[styles.summaryCard, styles.highlightCard, { backgroundColor: colors.gold ?? colors.primary }]}>
            <Feather name="dollar-sign" size={14} color="#0A1628" />
            <Text style={[styles.summaryLabel, { color: "rgba(10,22,40,0.7)" }]}>Freight</Text>
            <Text style={[styles.summaryValue, { color: "#0A1628", fontSize: 14 }]}>
              ₹{lr.frightCharge.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          PAYMENT BREAKDOWN
        </Text>
        <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.payRow}>
            <Text style={[styles.payLabel, { color: colors.mutedForeground }]}>Total Amount</Text>
            <Text style={[styles.payValue, { color: colors.foreground }]}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={[styles.payLabel, { color: colors.mutedForeground }]}>Advance (90%)</Text>
            <Text style={[styles.payValue, { color: colors.foreground }]}>₹{advance.toLocaleString("en-IN")}</Text>
          </View>
          <View style={[styles.payRow, styles.payRowFinal, { borderTopColor: colors.border }]}>
            <Text style={[styles.payLabel, { color: colors.gold ?? colors.primary, fontFamily: "Inter_600SemiBold" }]}>Balance</Text>
            <Text style={[styles.payValue, { color: colors.gold ?? colors.primary, fontFamily: "Inter_700Bold", fontSize: 18 }]}>
              ₹{balance.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          INVOICES ({lr.invoices.length})
        </Text>
        {lr.invoices.map((inv, i) => (
          <View
            key={inv.id}
            style={[
              styles.invoiceCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.invoiceRow}>
              <View style={[styles.invIndex, { backgroundColor: colors.gold ?? colors.primary }]}>
                <Text style={[styles.invIndexText, { color: "#0A1628" }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.invoiceNo, { color: colors.gold ?? colors.primary }]}>{inv.invoiceNo}</Text>
                <Text style={[styles.invoiceDrop, { color: colors.mutedForeground }]}>{inv.dropLocation}</Text>
              </View>
              <Text style={[styles.invoiceFreight, { color: colors.foreground }]}>
                ₹{inv.freightCharge.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          BANK DETAILS
        </Text>
        <View style={[styles.bankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bankName, { color: colors.foreground }]}>{COMPANY.bank.beneficiary}</Text>
          <Text style={[styles.bankDetail, { color: colors.mutedForeground }]}>A/C: {COMPANY.bank.accountNo}</Text>
          <Text style={[styles.bankDetail, { color: colors.mutedForeground }]}>{COMPANY.bank.bank}</Text>
          <Text style={[styles.bankDetail, { color: colors.mutedForeground }]}>IFSC: {COMPANY.bank.ifsc}</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          PDF PREVIEW
        </Text>
        <TouchableOpacity
          style={[styles.previewContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={40} color={colors.gold ?? colors.primary} />
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>
            {lr.lrNo}.pdf
          </Text>
          <Text style={[styles.previewSub, { color: colors.mutedForeground }]}>
            {Platform.OS === "web" ? "Tap to open LR in browser" : "Tap to open & share PDF"}
          </Text>
          <View style={[styles.previewBadge, { backgroundColor: (colors.gold ?? colors.primary) + "22" }]}>
            <Feather name={Platform.OS === "web" ? "external-link" : "share-2"} size={12} color={colors.gold ?? colors.primary} />
            <Text style={[styles.previewBadgeText, { color: colors.gold ?? colors.primary }]}>
              {Platform.OS === "web" ? "Open Preview" : "Share / Export"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => {
            setSelectedEmails([]);
            setShowEmailPicker(true);
          }}
          disabled={sendingEmail}
        >
          {sendingEmail ? (
            <Feather name="loader" size={18} color={colors.mutedForeground} />
          ) : (
            <Feather name="mail" size={18} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerShareBtn, generatingPDF && { opacity: 0.6 }]}
          onPress={handleShare}
          disabled={generatingPDF}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#D4A843", "#A8782E"]}
            style={styles.footerShareGradient}
          >
            <Feather
              name={generatingPDF ? "loader" : "share-2"}
              size={18}
              color="#0A1628"
            />
            <Text style={styles.footerShareText}>
              {Platform.OS === "web" ? "Open Preview" : generatingPDF ? "Generating..." : "Share PDF"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showEmailPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowEmailPicker(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Send via Gmail
            </Text>

            {settings.emailIds.length === 0 ? (
              <View style={styles.noEmails}>
                <Feather name="mail" size={32} color={colors.mutedForeground} />
                <Text style={[styles.noEmailsText, { color: colors.mutedForeground }]}>
                  No recipient emails configured.{"\n"}Go to Settings to add emails.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEmailPicker(false);
                    router.push("/(tabs)/settings");
                  }}
                >
                  <Text style={[{ color: colors.gold ?? colors.primary, fontFamily: "Inter_500Medium" }]}>
                    Open Settings
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  Select recipients for {lr.lrNo}
                </Text>
                {settings.emailIds.map((email) => (
                  <TouchableOpacity
                    key={email}
                    style={[
                      styles.emailOption,
                      {
                        backgroundColor: selectedEmails.includes(email)
                          ? (colors.gold ?? colors.primary) + "22"
                          : "transparent",
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => toggleEmail(email)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selectedEmails.includes(email)
                            ? colors.gold ?? colors.primary
                            : colors.border,
                          backgroundColor: selectedEmails.includes(email)
                            ? colors.gold ?? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      {selectedEmails.includes(email) && (
                        <Feather name="check" size={12} color="#0A1628" />
                      )}
                    </View>
                    <Text style={[styles.emailText, { color: colors.foreground }]}>
                      {email}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.sendEmailBtn,
                    selectedEmails.length === 0 && { opacity: 0.4 },
                  ]}
                  onPress={handleSendEmail}
                  disabled={selectedEmails.length === 0}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#D4A843", "#A8782E"]}
                    style={styles.sendEmailGradient}
                  >
                    <Feather name="send" size={16} color="#0A1628" />
                    <Text style={styles.sendEmailText}>
                      Send to {selectedEmails.length} recipient
                      {selectedEmails.length !== 1 ? "s" : ""}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSent} transparent animationType="fade">
        <View style={styles.sentOverlay}>
          <View
            style={[
              styles.sentCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {Platform.OS !== "web" ? (
              <LottieView
                ref={sentRef}
                source={require("@/assets/lottie/sent.json")}
                autoPlay
                loop={false}
                style={styles.sentLottie}
              />
            ) : (
              <View style={styles.sentLottie}>
                <Feather name="send" size={48} color="#2D9E6E" />
              </View>
            )}
            <Text style={[styles.sentTitle, { color: colors.foreground }]}>
              Email Sent!
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backLink: { padding: 8 },
  backLinkText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  editBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  highlightCard: { borderWidth: 0 },
  summaryLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  paymentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  payRow: { flexDirection: "row", justifyContent: "space-between" },
  payRowFinal: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  payLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  payValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  invoiceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  invoiceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  invIndex: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  invIndexText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  invoiceNo: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  invoiceDrop: { fontSize: 11, fontFamily: "Inter_400Regular" },
  invoiceFreight: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bankCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    marginBottom: 20,
  },
  bankName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bankDetail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    height: 160,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  webview: { flex: 1, backgroundColor: "#fff" },
  previewTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  previewSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  previewBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
    alignItems: "center",
  },
  footerBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerShareBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  footerShareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  footerShareText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0A1628",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 24,
    gap: 10,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  emailOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emailText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  sendEmailBtn: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  sendEmailGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  sendEmailText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0A1628" },
  noEmails: { alignItems: "center", gap: 12, paddingVertical: 20 },
  noEmailsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  sentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  sentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: 220,
  },
  sentLottie: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  sentTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
});
