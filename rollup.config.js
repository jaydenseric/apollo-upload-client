import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default {
  entry: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [
    babel()
  ],
  targets: [{
    dest: pkg['main'],
    format: 'cjs',
    sourceMap: true
  }, {
    dest: pkg['module'],
    format: 'es',
    sourceMap: true
  }]
}
