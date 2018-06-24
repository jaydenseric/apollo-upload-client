const {
  engines: { node }
} = require('./package.json')

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: node.substring(2) // Strip `>=`
        },
        shippedProposals: true,
        modules: process.env.MODULE ? false : 'commonjs',
        useBuiltIns: 'usage'
      }
    ]
  ],
  plugins: [
    [
      '@babel/transform-runtime',
      {
        polyfill: false,
        regenerator: false
      }
    ]
  ]
}
