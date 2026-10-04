/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// Tauri injects TAURI_ENV_* variables so we can pick an appropriate build target
// per platform. MUI v9 requires Chrome 117+ / Safari 17+, which is what the
// modern Tauri webviews (WebView2, WKWebView, WebKitGTK) provide.
const tauriPlatform = process.env.TAURI_ENV_PLATFORM
const isDebug = Boolean(process.env.TAURI_ENV_DEBUG)

export default defineConfig({
  plugins: [react()],
  // The running build reports the app version from package.json, so the desktop
  // app, the web build and the installers never disagree.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Tauri expects a fixed port and does not want Vite to wipe the terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: tauriPlatform === 'windows' ? 'chrome117' : 'safari17',
    minify: !isDebug,
    sourcemap: isDebug,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        // This package ships extensionless ESM imports that Node cannot resolve;
        // inline it so Vite's resolver handles it in tests.
        inline: ['@material/material-color-utilities'],
      },
    },
  },
})
