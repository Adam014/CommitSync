import { useStore } from "@/stores/store";

export const useHeatmap = () => ({
  dayCounts: useStore((s) => s.dayCounts),
  setDayCounts: useStore((s) => s.setDayCounts),
  loading: useStore((s) => s.loading),
  setLoading: useStore((s) => s.setLoading),
});
