import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  /* host:true deja entrar desde el celular, siempre que esté en la misma
     WiFi que esta computadora. Solo funciona mientras corre "npm run dev". */
  server: { port: 5173, host: true }
});
