import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.gradeit.app",
  appName: "GradeIT",
  webDir: "out", // or 'dist' depending on your Next.js build output
  server: {
    androidScheme: "https",
    cleartext: true,
  },
}

export default config
