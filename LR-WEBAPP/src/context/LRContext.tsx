import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  dropLocation: string;
  noOfPackages: string;
  description: string;
  goodsWeight: string;
  freightCharge: number;
}

export interface LRRecord {
  id: string;
  lrNo: string;
  consignmentNo: string;
  date: string;
  vehicleNo: string;
  routeId: 1 | 2;
  frightCharge: number;
  invoices: InvoiceRecord[];
  pdfUri?: string;
  createdAt: string;
}

export interface AppSettings {
  vehicles: string[];
  nextLrNumber: number;
  partnerName: string;
  partnerDetails: string;
  partnerAddress: string;
  partnerGst: string;
}

export const ROUTES = {
  1: {
    id: 1 as const,
    name: "Chennai → Manesar",
    pickupLocation: "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE (TN)",
    dropLocation: "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE (HR)",
    consignee:
      "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS P LTD\nThiruporur, Tamil Nadu, India\nPincode: 603105\nPhone: 7358237434",
    consignor:
      "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE\nGSTN: 33AAACK5968J3Z7\nManesar, Gurugram, Haryana 122051, India\nPincode: 123506\nPhone: 7358237434",
    frightCharge: 92000,
    defaultDrop: "Manesar",
  },
  2: {
    id: 2 as const,
    name: "Manesar → Chennai",
    pickupLocation: "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE (HR)",
    dropLocation: "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE (TN)",
    consignee:
      "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS PRIVATE\nGSTN: 33AAACK5968J3Z7\nManesar, Gurugram, Haryana 122051, India\nPincode: 123506\nPhone: 7358237434",
    consignor:
      "HITACHI ASTEMO GURUGRAM POWERTRAIN SYSTEMS P LTD\nThiruporur, Tamil Nadu, India\nPincode: 603105\nPhone: 7358237434",
    frightCharge: 95000,
    defaultDrop: "Chennai",
  },
};

export const COMPANY = {
  name: "MAHA LAXMI TRANSPORT CO.",
  address:
    "Ho No. 27/2 LADPURA GREATER NOIDA GAUTAM BUDDHA NAGAR, UTTAR PRADESH, GREATER NOIDA",
  email: "mahalaxmitransport9485@gmail.com",
  phone: "9911257866",
  gst: "09ETOPS1846F2Z3",
  pan: "ETOPS1846F",
  bank: {
    beneficiary: "Maha Laxmi Transport Co.",
    accountNo: "50200038540629",
    bank: "HDFC BANK, OMEGA-1",
    ifsc: "HDFC0002845",
  },
};

const STORAGE_KEYS = {
  LRS: "@lr_records",
  SETTINGS: "@app_settings",
};

const DEFAULT_SETTINGS: AppSettings = {
  vehicles: ["UP16PT9444"],
  nextLrNumber: 88,
  partnerName: "NISSIN ABC LOGISTICS PVT. LTD.",
  partnerDetails:
    "Unit No. 222, 244, 246 & 247, 2nd Floor,\nCentrum Plaza, Golf Course Road, Sector - 53,\nGurugram - 122 002, Haryana,\nGSTIN: 06AABCN0379D1ZS",
  partnerAddress:
    "Unit No. 222, 244, 246 & 247, 2nd Floor,\nCentrum Plaza, Golf Course Road, Sector - 53,\nGurugram - 122 002, Haryana",
  partnerGst: "06AABCN0379D1ZS",
};

interface LRContextType {
  lrs: LRRecord[];
  settings: AppSettings;
  isLoading: boolean;
  addLR: (lr: Omit<LRRecord, "id" | "createdAt">) => Promise<LRRecord>;
  updateLR: (id: string, updates: Partial<LRRecord>) => Promise<void>;
  deleteLR: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  getLRById: (id: string) => LRRecord | undefined;
  getNextLrNo: () => string;
  restoreBackup: (backupData: {
    lrs: LRRecord[];
    settings: AppSettings;
  }) => Promise<void>;
}

const LRContext = createContext<LRContextType | null>(null);

export function LRProvider({ children }: { children: React.ReactNode }) {
  const [lrs, setLrs] = useState<LRRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const lrsJson = localStorage.getItem(STORAGE_KEYS.LRS);
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (lrsJson) setLrs(JSON.parse(lrsJson));
      if (settingsJson) {
        const parsed = JSON.parse(settingsJson);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };

        // Migrate legacy partnerDetails to separate address & GST if missing
        if (
          merged.partnerDetails &&
          (!merged.partnerAddress || !merged.partnerGst)
        ) {
          const lines = merged.partnerDetails.split("\n");
          const gstLine = lines.find(
            (l: string) =>
              l.toUpperCase().includes("GSTIN") ||
              l.toUpperCase().includes("GSTN"),
          );
          if (gstLine) {
            merged.partnerGst = gstLine
              .replace(/GSTIN:\s*|GSTN:\s*/i, "")
              .trim();
            merged.partnerAddress = lines
              .filter(
                (l: string) =>
                  !l.toUpperCase().includes("GSTIN") &&
                  !l.toUpperCase().includes("GSTN"),
              )
              .join("\n")
              .replace(/,$/, "")
              .trim();
          } else {
            merged.partnerAddress = merged.partnerDetails;
            merged.partnerGst = "";
          }
        }
        setSettings(merged);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  const saveLRs = useCallback(async (records: LRRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.LRS, JSON.stringify(records));
    setLrs(records);
  }, []);

  const saveSettings = useCallback(async (s: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    setSettings(s);
  }, []);

  const addLR = useCallback(
    async (lr: Omit<LRRecord, "id" | "createdAt">) => {
      const newLR: LRRecord = {
        ...lr,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        createdAt: new Date().toISOString(),
      };
      const updated = [newLR, ...lrs];
      await saveLRs(updated);
      const newNum = settings.nextLrNumber + 1;
      await saveSettings({ ...settings, nextLrNumber: newNum });
      return newLR;
    },
    [lrs, settings, saveLRs, saveSettings],
  );

  const updateLR = useCallback(
    async (id: string, updates: Partial<LRRecord>) => {
      const updated = lrs.map((lr) =>
        lr.id === id ? { ...lr, ...updates } : lr,
      );
      await saveLRs(updated);
    },
    [lrs, saveLRs],
  );

  const deleteLR = useCallback(
    async (id: string) => {
      const updated = lrs.filter((lr) => lr.id !== id);
      await saveLRs(updated);
    },
    [lrs, saveLRs],
  );

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const updated = { ...settings, ...updates };
      await saveSettings(updated);
    },
    [settings, saveSettings],
  );

  const getLRById = useCallback(
    (id: string) => lrs.find((lr) => lr.id === id),
    [lrs],
  );

  const getNextLrNo = useCallback(
    () => `MLTC-${settings.nextLrNumber}`,
    [settings.nextLrNumber],
  );

  const restoreBackup = useCallback(
    async (backupData: { lrs: LRRecord[]; settings: AppSettings }) => {
      if (backupData.lrs && Array.isArray(backupData.lrs)) {
        await saveLRs(backupData.lrs);
      }
      if (backupData.settings) {
        await saveSettings({ ...DEFAULT_SETTINGS, ...backupData.settings });
      }
    },
    [saveLRs, saveSettings],
  );

  return (
    <LRContext.Provider
      value={{
        lrs,
        settings,
        isLoading,
        addLR,
        updateLR,
        deleteLR,
        updateSettings,
        getLRById,
        getNextLrNo,
        restoreBackup,
      }}
    >
      {children}
    </LRContext.Provider>
  );
}

export function useLR() {
  const ctx = useContext(LRContext);
  if (!ctx) throw new Error("useLR must be used inside LRProvider");
  return ctx;
}
