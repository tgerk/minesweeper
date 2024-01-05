// vite.config.ts
import { defineConfig } from "vite";
import solidJS from "vite-plugin-solid";
var vite_config_default = defineConfig({
  plugins: [solidJS()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false
  },
  base: "/minesweeper/"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHNvbGlkSlMgZnJvbSAndml0ZS1wbHVnaW4tc29saWQnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbc29saWRKUygpXSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIHBvbHlmaWxsRHluYW1pY0ltcG9ydDogZmFsc2UsXG4gIH0sXG4gIGJhc2U6ICcvbWluZXN3ZWVwZXIvJ1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxhQUFhO0FBRXBCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFBQSxFQUNuQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUix1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsTUFBTTtBQUNSLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
