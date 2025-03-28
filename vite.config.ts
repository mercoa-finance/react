import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vitePluginRequire from 'vite-plugin-require'

function transformPdfJsWorker(): Plugin {
  return {
    name: 'transform-pdf-js-worker',
    generateBundle(options, bundle) {
      for (const [fileName, chunkOrAsset] of Object.entries(bundle)) {
        if (!fileName.includes('pdf.worker') || chunkOrAsset.type !== 'asset') {
          continue
        }
        const prepend = Buffer.from(
          `if (typeof Promise.withResolvers === "undefined") {
            Promise.withResolvers = function () {
              let resolve, reject
              const promise = new Promise((res, rej) => {
                resolve = res
                reject = rej
              })
              return { promise, resolve, reject }
            }
          }
          `,
          'utf-8',
        )
        const sourceBuffer = Buffer.isBuffer(chunkOrAsset.source)
          ? chunkOrAsset.source
          : Buffer.from(chunkOrAsset.source)
        chunkOrAsset.source = Buffer.concat([prepend, sourceBuffer])
      }
    },
  }
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    transformPdfJsWorker(),
    vitePluginRequire(),
    react(),
    dts({
      insertTypesEntry: true,
    }),
    viteCommonjs(),
    nodePolyfills(),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      name: 'MercoaReact',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
})
