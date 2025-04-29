import { useStore } from "@/stores/store";

export const useTheme = () =>
  useStore((state) => ({
    darkMode: state.darkMode,
    toggleDarkMode: state.toggleDarkMode,
    isEmbed: state.isEmbed,
    mounted: state.mounted,
    setDarkMode: state.setDarkMode,
    setIsEmbed: state.setIsEmbed,
    setMounted: state.setMounted,
  }));
