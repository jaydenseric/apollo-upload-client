const {
  engines: { node }
} = require('./package.json')

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        targets: { node: node.substring(2) }, // Strip `>=`
        shippedProposals: true,
        loose: true
      }
    ]
  ]
}
