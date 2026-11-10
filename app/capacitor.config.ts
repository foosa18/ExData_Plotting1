import type { CapacitorConfig } from "@capacitor/cli";

// The iOS and Android apps load the same web build (dist/) as the hosted dashboard.
// Change appId to a reverse-domain ID you own before publishing to the stores; it cannot change afterwards.
const config: CapacitorConfig = {
  appId: "com.foosa18.investing",
  appName: "Investing",
  webDir: "dist",
  ios: { contentInset: "never" },
  android: { backgroundColor: "#f4f5f3" },
};

export default config;
