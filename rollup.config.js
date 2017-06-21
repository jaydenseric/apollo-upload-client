import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'

const pkg = require('./package.json')

export default {
  entry: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [
    babel({
      plugins: ['external-helpers'],
      externalHelpers: true
    }),
    nodeResolve(),
    commonjs()
  ],
  targets: [
    {
      dest: pkg['main'],
      format: 'cjs',
      sourceMap: true
    },
    {
      dest: pkg['module'],
      format: 'es',
      sourceMap: true
    }
  ]
}
