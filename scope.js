const {Mixin, Collection} = require('nucleotides')

module.exports = Mixin('ScopeMixin')
  .method('bindToScope', function (scope, options) {
    this.$emit('mount', options)
    this.constructor.$emit('mount', this, options)
    let listenForChange = () => scope.$evalAsync()
    scope.$on('$destroy', () => {
      this.$emit('unmount')
      this.constructor.$emit('unmount', this)
      this.$off('change', listenForChange)
    })
    this.$on('change', listenForChange)
  })
  .implement(Collection.$$prepareCollection, function (scope, options) {
    this.bindToScope = function () {
      this.$emit('mount', options)
      let listenForChange = (object) => {
        if (this.has(object)) {
          scope.$evalAsync()
        }
      }
      scope.$on('$destroy', () => {
        this.$emit('unmount')
        this.$model.$off('change', listenForChange)
      })
      this.$model.$on('change', listenForChange)
    }
  })
