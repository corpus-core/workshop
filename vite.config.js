// Vite is only the dev server here; there is no build step to configure.
export default {
  optimizeDeps: {
    // Colibri loads its WASM via `new URL("./c4w.wasm", import.meta.url)`.
    // Pre-bundling moves the JS into node_modules/.vite/deps without the .wasm
    // file, so the browser would fetch index.html instead of the binary.
    exclude: ["@corpus-core/colibri-stateless"],
  },
};
