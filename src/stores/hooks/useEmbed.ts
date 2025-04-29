import { useStore } from "@/stores/store";

export const useEmbed = () =>
  useStore((state) => ({
    gitHubUsername: state.gitHubUsername,
    setGitHubUsername: state.setGitHubUsername,
    gitLabUsername: state.gitLabUsername,
    setGitLabUsername: state.setGitLabUsername,
    autoSyncEnabled: state.autoSyncEnabled,
    setAutoSyncEnabled: state.setAutoSyncEnabled,
    embedCode: state.embedCode,
    setEmbedCode: state.setEmbedCode,
    copied: state.copied,
    setCopied: state.setCopied,
    embedTheme: state.embedTheme,
    setEmbedTheme: state.setEmbedTheme,
    bgColor: state.bgColor,
    setBgColor: state.setBgColor,
  }));
