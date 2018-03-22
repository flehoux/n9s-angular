const {Mixin, Protocol} = require('@n9s/core')

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', function (mixin, scope, options) {
    this.$mount(options)
    let scopeApply = (...args) => {
      scope.$applyAsync()
    }
    let unbind = () => {
      this.$unmount()
      this.$off('update', scopeApply)
      this.$off('resolved', scopeApply)
    }
    let unbindScope = scope.$on('$destroy', unbind)
    this.$on('update', scopeApply)
    this.$on('resolved', scopeApply)

    return () => {
      unbind()
      unbindScope()
    }
  })
  .implement(Protocol.Collectable.prepareCollection, function (mixin, collection, options) {
    collection.bindToScope = function (scope) {
      this.$mount()
      let scopeApply = (object) => {
        if (this.$has(object)) {
          scope.$applyAsync()
        }
      }
      let bindScopeApply = () => scope.$applyAsync()
      let unbindAll = () => {
        this.$unmount()
        this.$model.$off('update', scopeApply)
        this.$model.$off('resolved', scopeApply)
        this.$off('add', bindScopeApply)
        this.$off('remove', bindScopeApply)
      }
      let unbindScope = scope.$on('$destroy', unbindAll)
      this.$model.$on('update', scopeApply)
      this.$model.$on('resolved', scopeApply)
      this.$on('add', bindScopeApply)
      this.$on('remove', bindScopeApply)
      return () => {
        unbindAll()
        unbindScope()
      }
    }
  })
