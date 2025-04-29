import { useStore } from "@/stores/store";

export const useHeatmap = () =>
  useStore((state) => ({
    dayCounts: state.dayCounts,
    setDayCounts: state.setDayCounts,
    loading: state.loading,
    setLoading: state.setLoading,
  }));
