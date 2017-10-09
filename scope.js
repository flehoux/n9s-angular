const {Mixin, Protocol} = require('nucleotides')

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', function (mixin, scope, options) {
    this.$emit('mount', options)
    this.constructor.$emit('mount', this, options)
    let scopeApply = (...args) => {
      scope.$applyAsync()
    }
    let unbind = () => {
      this.$emit('unmount')
      this.constructor.$emit('unmount', this)
      this.$off('change', scopeApply)
      this.$off('resolved', scopeApply)
    }
    let unbindScope = scope.$on('$destroy', unbind)
    this.$on('change', scopeApply)
    this.$on('resolved', scopeApply)

    return () => {
      unbind()
      unbindScope()
    }
  })
  .implement(Protocol.Collectable.prepareCollection, function (mixin, collection, options) {
    collection.bindToScope = function (scope) {
      this.$emit('mount', options)
      let scopeApply = (object) => {
        if (this.$has(object)) {
          scope.$applyAsync()
        }
      }
      let bindScopeApply = () => scope.$applyAsync()
      let unbindAll = () => {
        this.$emit('unmount')
        this.$model.$off('change', scopeApply)
        this.$model.$off('resolved', scopeApply)
        this.$off('add', bindScopeApply)
        this.$off('remove', bindScopeApply)
      }
      let unbindScope = scope.$on('$destroy', unbindAll)
      this.$model.$on('change', scopeApply)
      this.$model.$on('resolved', scopeApply)
      this.$on('add', bindScopeApply)
      this.$on('remove', bindScopeApply)
      return () => {
        unbindAll()
        unbindScope()
      }
    }
  })
