import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [dts({
        insertTypesEntry: true,
        rollupTypes: true,
        exclude: ["**/node_modules/**", "Pane", "tweakpane", "@tweakpane/core"],
    })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/lib.ts'),
      name: 'Renderblade',
      // the proper extensions will be added
      fileName: 'renderblade',
      formats: ['es'],
      
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['tweakpane', "@tweakpane/core"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          tweakpane: 'Tweakpane',
        },
      },
    },
  },
})