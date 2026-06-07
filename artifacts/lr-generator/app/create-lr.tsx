import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { InvoiceRow } from "@/components/InvoiceRow";
import { useLR, ROUTES, type InvoiceRecord } from "@/context/LRContext";
import { generatePDF } from "@/services/pdfService";
import { useColors } from "@/hooks/useColors";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

function newInvoice(dropLocation: string, freightCharge: number): InvoiceRecord {
  return {
    id: generateId(),
    invoiceNo: "",
    dropLocation,
    noOfPackages: "AS PER INVOICE",
    description: "AS PER INVOICE",
    goodsWeight: "AS PER INVOICE",
    freightCharge,
  };
}

export default function CreateLRScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    edit?: string;
    routeId?: string;
    consignmentNo?: string;
    invoiceNos?: string;
  }>();
  const { lrs, addLR, updateLR, getLRById, getNextLrNo, settings } = useLR();
  const successRef = useRef<LottieView>(null);

  const editId = params.edit;
  const existing = editId ? getLRById(editId) : undefined;
  const isEdit = !!existing;

  const [routeId, setRouteId] = useState<1 | 2>(
    existing ? existing.routeId : params.routeId === "2" ? 2 : 1
  );
  const [lrNo, setLrNo] = useState(
    existing ? existing.lrNo : getNextLrNo()
  );
  const [consignmentNo, setConsignmentNo] = useState(
    existing?.consignmentNo ?? params.consignmentNo ?? ""
  );
  const [date, setDate] = useState(() => {
    if (existing) return existing.date;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}-${m}-${y}`;
  });
  const [vehicleNo, setVehicleNo] = useState(
    existing?.vehicleNo ?? settings.vehicles[0] ?? ""
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    if (existing) return existing.invoices;
    const route = ROUTES[params.routeId === "2" ? 2 : 1];
    const preloaded = params.invoiceNos
      ? params.invoiceNos.split("|").filter(Boolean).map((inv) => ({
          ...newInvoice(route.defaultDrop, route.frightCharge),
          invoiceNo: inv,
        }))
      : [];
    return preloaded.length > 0
      ? preloaded
      : [newInvoice(route.defaultDrop, route.frightCharge)];
  });

  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const route = ROUTES[routeId];

  useEffect(() => {
    if (!isEdit) {
      setLrNo(getNextLrNo());
    }
  }, []);

  function handleRouteChange(id: 1 | 2) {
    setRouteId(id);
    const r = ROUTES[id];
    setInvoices((prev) =>
      prev.map((inv) => ({
        ...inv,
        dropLocation: r.defaultDrop,
        freightCharge: r.frightCharge,
      }))
    );
    setShowRoutePicker(false);
  }

  function handleInvoiceChange(
    id: string,
    field: keyof InvoiceRecord,
    value: string
  ) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              [field]:
                field === "freightCharge" ? Number(value) || 0 : value,
            }
          : inv
      )
    );
  }

  function addInvoiceRow() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInvoices((prev) => [
      ...prev,
      newInvoice(route.defaultDrop, route.frightCharge),
    ]);
  }

  function deleteInvoiceRow(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  function validate(): string | null {
    if (!lrNo.trim()) return "LR No is required.";
    if (!consignmentNo.trim()) return "Consignment No is required.";
    if (!date.trim() || !/^\d{2}-\d{2}-\d{4}$/.test(date))
      return "Date must be in DD-MM-YYYY format.";
    if (!vehicleNo.trim()) return "Vehicle No is required.";
    if (invoices.length === 0) return "At least one invoice is required.";
    for (const inv of invoices) {
      if (!inv.invoiceNo.trim()) return "All invoice numbers are required.";
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      Alert.alert("Validation Error", err);
      return;
    }

    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSaving(true);
    try {
      const totalFreight = invoices.reduce(
        (sum, inv) => sum + inv.freightCharge,
        0
      );

      const lrData = {
        lrNo: lrNo.trim(),
        consignmentNo: consignmentNo.trim(),
        date: date.trim(),
        vehicleNo: vehicleNo.trim(),
        routeId,
        frightCharge: totalFreight,
        invoices,
      };

      let savedId = editId;
      if (isEdit && editId) {
        await updateLR(editId, lrData);
      } else {
        const saved = await addLR(lrData);
        savedId = saved.id;

        if (Platform.OS !== "web") {
          try {
            const pdfUri = await generatePDF({
              ...lrData,
              id: saved.id,
              createdAt: saved.createdAt,
            });
            await updateLR(saved.id, { pdfUri });
          } catch {
            // PDF generation failed — LR still saved, continue
          }
        }
      }

      setShowSuccess(true);
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setShowSuccess(false);
        if (savedId) {
          router.replace(`/lr-detail/${savedId}`);
        } else {
          router.back();
        }
      }, 2000);
    } catch {
      Alert.alert("Error", "Failed to save LR. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  const readonlyStyle = [
    styles.input,
    styles.readonly,
    {
      backgroundColor: colors.muted,
      borderColor: colors.border,
      color: colors.mutedForeground,
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEdit ? "Edit LR" : "New LR"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        bottomOffset={80}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ROUTE
        </Text>
        <TouchableOpacity
          style={[
            styles.selector,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setShowRoutePicker(true)}
        >
          <Feather name="map" size={16} color={colors.gold ?? colors.primary} />
          <Text style={[styles.selectorText, { color: colors.foreground }]}>
            {route.name}
          </Text>
          <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          LR DETAILS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            LR No
          </Text>
          <TextInput
            style={inputStyle}
            value={lrNo}
            onChangeText={setLrNo}
            placeholder="MLTC-88"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />

          <Text
            style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}
          >
            Consignment No *
          </Text>
          <TextInput
            style={inputStyle}
            value={consignmentNo}
            onChangeText={setConsignmentNo}
            placeholder="e.g. 378301"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text
            style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}
          >
            Date (DD-MM-YYYY)
          </Text>
          <TextInput
            style={inputStyle}
            value={date}
            onChangeText={setDate}
            placeholder="01-06-2026"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
          />

          <Text
            style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}
          >
            Vehicle No *
          </Text>
          <TouchableOpacity
            style={[
              styles.selector,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            onPress={() => setShowVehiclePicker(true)}
          >
            <Feather
              name="truck"
              size={16}
              color={colors.gold ?? colors.primary}
            />
            <Text
              style={[
                styles.selectorText,
                { color: vehicleNo ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {vehicleNo || "Select vehicle"}
            </Text>
            <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          AUTO-FILLED (FROM ROUTE)
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Pickup Location
          </Text>
          <Text style={[styles.readonlyText, { color: colors.mutedForeground }]}>
            {route.pickupLocation}
          </Text>

          <Text
            style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}
          >
            Drop Location
          </Text>
          <Text style={[styles.readonlyText, { color: colors.mutedForeground }]}>
            {route.dropLocation}
          </Text>

          <View style={styles.freightRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Freight Charge
            </Text>
            <Text style={[styles.freightAmount, { color: colors.gold ?? colors.primary }]}>
              ₹{route.frightCharge.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceHeader}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            INVOICES
          </Text>
          <TouchableOpacity
            style={[
              styles.addInvoiceBtn,
              { borderColor: colors.gold ?? colors.primary },
            ]}
            onPress={addInvoiceRow}
          >
            <Feather name="plus" size={14} color={colors.gold ?? colors.primary} />
            <Text
              style={[
                styles.addInvoiceText,
                { color: colors.gold ?? colors.primary },
              ]}
            >
              Add Row
            </Text>
          </TouchableOpacity>
        </View>

        {invoices.map((inv, i) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            index={i}
            canDelete={invoices.length > 1}
            onChange={handleInvoiceChange}
            onDelete={deleteInvoiceRow}
          />
        ))}
      </KeyboardAwareScrollView>

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
          style={[
            styles.saveButton,
            saving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#D4A843", "#A8782E"]}
            style={styles.saveBtnGradient}
          >
            <Feather name={isEdit ? "save" : "file-plus"} size={18} color="#0A1628" />
            <Text style={styles.saveBtnText}>
              {saving
                ? "Saving..."
                : isEdit
                ? "Update LR"
                : "Generate & Save LR"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showRoutePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowRoutePicker(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Route
            </Text>
            {([1, 2] as const).map((id) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor:
                      routeId === id ? (colors.gold ?? colors.primary) + "22" : "transparent",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleRouteChange(id)}
              >
                <Feather
                  name="map-pin"
                  size={16}
                  color={
                    routeId === id
                      ? colors.gold ?? colors.primary
                      : colors.mutedForeground
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color:
                          routeId === id
                            ? colors.gold ?? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {ROUTES[id].name}
                  </Text>
                  <Text
                    style={[
                      styles.modalOptionSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    ₹{ROUTES[id].frightCharge.toLocaleString("en-IN")}
                  </Text>
                </View>
                {routeId === id && (
                  <Feather
                    name="check"
                    size={18}
                    color={colors.gold ?? colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showVehiclePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowVehiclePicker(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Vehicle
            </Text>
            {settings.vehicles.length === 0 ? (
              <Text style={[styles.modalEmpty, { color: colors.mutedForeground }]}>
                No vehicles added. Go to Settings to add vehicles.
              </Text>
            ) : (
              settings.vehicles.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        vehicleNo === v
                          ? (colors.gold ?? colors.primary) + "22"
                          : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setVehicleNo(v);
                    setShowVehiclePicker(false);
                  }}
                >
                  <Feather
                    name="truck"
                    size={16}
                    color={
                      vehicleNo === v
                        ? colors.gold ?? colors.primary
                        : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color:
                          vehicleNo === v
                            ? colors.gold ?? colors.primary
                            : colors.foreground,
                        flex: 1,
                      },
                    ]}
                  >
                    {v}
                  </Text>
                  {vehicleNo === v && (
                    <Feather
                      name="check"
                      size={18}
                      color={colors.gold ?? colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {Platform.OS !== "web" ? (
              <LottieView
                ref={successRef}
                source={require("@/assets/lottie/invoice_made.json")}
                autoPlay
                loop={false}
                style={styles.successLottie}
              />
            ) : (
              <View style={styles.successLottie}>
                <Feather name="check-circle" size={64} color="#2D9E6E" />
              </View>
            )}
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {isEdit ? "LR Updated!" : "LR Created!"}
            </Text>
            <Text
              style={[styles.successSubtitle, { color: colors.mutedForeground }]}
            >
              PDF generated successfully
            </Text>
          </View>
        </View>
      </Modal>
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  readonly: { opacity: 0.7 },
  readonlyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  freightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  freightAmount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 4,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addInvoiceText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveButton: { borderRadius: 14, overflow: "hidden" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
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
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  modalOptionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  modalEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 16,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: 280,
  },
  successLottie: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
