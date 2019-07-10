module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        shippedProposals: true,
        loose: true
      }
    ]
  ],
  plugins: ['@babel/transform-runtime']
}
