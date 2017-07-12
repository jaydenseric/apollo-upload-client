import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default {
  entry: 'src/index.js',
  external: path =>
    Object.keys(pkg.dependencies).some(name => path.startsWith(name)),
  plugins: [
    babel({
      runtimeHelpers: true
    })
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
