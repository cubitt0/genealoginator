import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base: './' keeps URLs relative; viteSingleFile inlines the JS + CSS into one
// self-contained dist/index.html - servable by any static host (GitHub Pages) and
// openable directly from disk (file://), with no server or build step required.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
});
