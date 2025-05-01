import { useStore } from "@/stores/store";

export const useEmbed = () => ({
  gitHubUsername: useStore((s) => s.gitHubUsername),
  setGitHubUsername: useStore((s) => s.setGitHubUsername),
  gitLabUsername: useStore((s) => s.gitLabUsername),
  setGitLabUsername: useStore((s) => s.setGitLabUsername),
  autoSyncEnabled: useStore((s) => s.autoSyncEnabled),
  setAutoSyncEnabled: useStore((s) => s.setAutoSyncEnabled),
  embedCode: useStore((s) => s.embedCode),
  setEmbedCode: useStore((s) => s.setEmbedCode),
  copied: useStore((s) => s.copied),
  setCopied: useStore((s) => s.setCopied),
  embedTheme: useStore((s) => s.embedTheme),
  setEmbedTheme: useStore((s) => s.setEmbedTheme),
  bgColor: useStore((s) => s.bgColor),
  setBgColor: useStore((s) => s.setBgColor),
});
