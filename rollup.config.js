import ts from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import loader from 'graphql-tag/loader'
import fs from 'fs'
import path from 'path'
import { dependencies } from './package.json'

/** @returns {import('rollup').Plugin} */
function image() {
  return {
    resolveFileUrl({ fileName }) {
      return `require('path').resolve(__dirname, ${JSON.stringify(fileName)})`
    },
    resolveId(source, importer) {
      if (source.endsWith('.png')) {
        return path.resolve(path.dirname(importer), source)
      }
    },
    load(id) {
      if (id.endsWith('.png')) {
        const referenceId = this.emitFile({
          type: 'asset',
          name: path.basename(id),
          source: fs.readFileSync(id),
        })
        return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`
      }
    },
  }
}
/** @returns {import('rollup').Plugin} */
function graphql() {
  return {
    transform(code, id) {
      if (!id.endsWith('.graphql')) return
      const output = loader.call({ cacheable() {} }, code)

      return {
        code: output.replace(/module\.exports\s*=/, 'export default'),
        map: {
          mappings: '',
        },
      }
    },
  }
}

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/app.js',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [ts(), resolve(), image(), graphql({})],
  external: ['querystring', 'crypto', ...Object.keys(dependencies)],
}
