import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mainmmv.subs",
  appName: "MMV Hub",
  webDir: "dist",
  plugins: {
    LocalNotifications: {
      iconColor: "#39795E",
    },
  },
};

export default config;
