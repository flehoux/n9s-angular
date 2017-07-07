const {Mixin, Collection} = require('nucleotides')

function bindToScope (scope, options) {
  this.$emit('mount', options)
  this.constructor.$emit('mount', this, options)
  let listenForChange = () => scope.$evalAsync()
  scope.$on('$destroy', () => {
    this.$emit('unmount')
    this.constructor.$emit('unmount', this)
    this.$off('change', listenForChange)
  })
  this.$on('change', listenForChange)
}

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', bindToScope)
  .implement(Collection.$$prepareCollection, bindToScope)
