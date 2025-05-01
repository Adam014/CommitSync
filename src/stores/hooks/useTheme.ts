import { useStore } from "@/stores/store";

export const useTheme = () => {
  return {
    darkMode: useStore((s) => s.darkMode),
    toggleDarkMode: useStore((s) => s.toggleDarkMode),
    isEmbed: useStore((s) => s.isEmbed),
    mounted: useStore((s) => s.mounted),
    setDarkMode: useStore((s) => s.setDarkMode),
    setIsEmbed: useStore((s) => s.setIsEmbed),
    setMounted: useStore((s) => s.setMounted),
  };
};
