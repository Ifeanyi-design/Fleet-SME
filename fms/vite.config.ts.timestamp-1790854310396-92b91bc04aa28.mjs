// vite.config.ts
import { defineConfig } from "file:///C:/Users/IFEANYI/Documents/SME/fms/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/IFEANYI/Documents/SME/fms/node_modules/@vitejs/plugin-react/dist/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/IFEANYI/Documents/SME/fms/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    // Vite's default emptyDir() deletes the output tree recursively, which this
    // environment's delete-guard shim blocks. `npm run build` runs scripts/clean-dist.mjs
    // first (non-recursive file deletes) instead.
    emptyOutDir: false,
    // No manualChunks: forcing recharts into a named chunk made Rollup hoist a shared
    // module into it that the entry also needed, which turned the 411 kB chart bundle
    // into a STATIC import of the entry (modulepreloaded on first paint). Letting Rollup
    // split on dynamic-import boundaries keeps recharts inside the Dashboard chunk, where
    // it is only fetched when a chart page is visited.
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    // Proxy API calls to the Flask backend during development.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxJRkVBTllJXFxcXERvY3VtZW50c1xcXFxTTUVcXFxcZm1zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxJRkVBTllJXFxcXERvY3VtZW50c1xcXFxTTUVcXFxcZm1zXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9JRkVBTllJL0RvY3VtZW50cy9TTUUvZm1zL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gVml0ZSdzIGRlZmF1bHQgZW1wdHlEaXIoKSBkZWxldGVzIHRoZSBvdXRwdXQgdHJlZSByZWN1cnNpdmVseSwgd2hpY2ggdGhpc1xuICAgIC8vIGVudmlyb25tZW50J3MgZGVsZXRlLWd1YXJkIHNoaW0gYmxvY2tzLiBgbnBtIHJ1biBidWlsZGAgcnVucyBzY3JpcHRzL2NsZWFuLWRpc3QubWpzXG4gICAgLy8gZmlyc3QgKG5vbi1yZWN1cnNpdmUgZmlsZSBkZWxldGVzKSBpbnN0ZWFkLlxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcbiAgICAvLyBObyBtYW51YWxDaHVua3M6IGZvcmNpbmcgcmVjaGFydHMgaW50byBhIG5hbWVkIGNodW5rIG1hZGUgUm9sbHVwIGhvaXN0IGEgc2hhcmVkXG4gICAgLy8gbW9kdWxlIGludG8gaXQgdGhhdCB0aGUgZW50cnkgYWxzbyBuZWVkZWQsIHdoaWNoIHR1cm5lZCB0aGUgNDExIGtCIGNoYXJ0IGJ1bmRsZVxuICAgIC8vIGludG8gYSBTVEFUSUMgaW1wb3J0IG9mIHRoZSBlbnRyeSAobW9kdWxlcHJlbG9hZGVkIG9uIGZpcnN0IHBhaW50KS4gTGV0dGluZyBSb2xsdXBcbiAgICAvLyBzcGxpdCBvbiBkeW5hbWljLWltcG9ydCBib3VuZGFyaWVzIGtlZXBzIHJlY2hhcnRzIGluc2lkZSB0aGUgRGFzaGJvYXJkIGNodW5rLCB3aGVyZVxuICAgIC8vIGl0IGlzIG9ubHkgZmV0Y2hlZCB3aGVuIGEgY2hhcnQgcGFnZSBpcyB2aXNpdGVkLlxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIC8vIFByb3h5IEFQSSBjYWxscyB0byB0aGUgRmxhc2sgYmFja2VuZCBkdXJpbmcgZGV2ZWxvcG1lbnQuXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1MsU0FBUyxvQkFBb0I7QUFDalUsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZSxXQUFXO0FBRm9KLElBQU0sMkNBQTJDO0FBS3hPLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBLElBSUwsYUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1iLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUVOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
