const {Mixin} = require('nucleotides')

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', function (scope, options) {
    this.$emit('load', options)
    this.constructor.$emit('load', this, options)
    let listenForChange = () => scope.$evalAsync()
    scope.$on('$destroy', () => {
      this.$emit('unload')
      this.constructor.$emit('unload', this)
      this.$off('change', listenForChange)
    })
    this.$on('change', listenForChange)
  })
