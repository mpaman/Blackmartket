import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // ✅ เปิดรับ connection จาก network
    port: 5173, // หรือกำหนดพอร์ตเอง เช่น 3000
  },
});
