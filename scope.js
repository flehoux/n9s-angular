const {Mixin, Protocol} = require('nucleotides')

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', function (mixin, scope, options) {
    this.$emit('mount', options)
    this.constructor.$emit('mount', this, options)
    let scopeApply = (...args) => {
      scope.$applyAsync()
    }
    scope.$on('$destroy', () => {
      this.$emit('unmount')
      this.constructor.$emit('unmount', this)
      this.$off('change', scopeApply)
    })
    this.$on('change', scopeApply)
    this.$on('resolved', scopeApply)
  })
  .implement(Protocol.Collectable.prepareCollection, function (mixin, collection, options) {
    collection.bindToScope = function (scope) {
      this.$emit('mount', options)
      let scopeApply = (object) => {
        if (this.$has(object)) {
          scope.$applyAsync()
        }
      }
      let blindScopeApply = () => scope.$applyAsync()
      scope.$on('$destroy', () => {
        this.$emit('unmount')
        this.$model.$off('change', scopeApply)
        this.$model.$off('resolved', scopeApply)
        this.$off('add', blindScopeApply)
        this.$off('remove', blindScopeApply)
      })
      this.$model.$on('change', scopeApply)
      this.$model.$on('resolved', scopeApply)
      this.$on('add', blindScopeApply)
      this.$on('remove', blindScopeApply)
    }
  })
