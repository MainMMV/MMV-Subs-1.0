import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mainmmv.subs",
  appName: "MMV Hub",
  webDir: "dist",
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com"],
    },
    LocalNotifications: {
      iconColor: "#39795E",
    },
  },
};

export default config;
