import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Generates type declarations (.d.ts) automatically
  minify: true,
  external: ['react', 'react-dom'], // Excludes React and React DOM from bundle
  sourcemap: true,
  clean: true, // Clean dist folder before build
});
