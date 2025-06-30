import { create } from "zustand";

type ToastStatus = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  title: string;
  description?: string;
  status: ToastStatus;
  duration?: number;
}

interface ToastStore {
  toast: ToastData | null;
  showToast: (toast: ToastData) => void;
  clearToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));
