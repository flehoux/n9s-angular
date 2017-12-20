module.exports = {
  HttpMixin: require('./http'),
  ScopeMixin: require('./scope'),
  patchPromises: function ($q) {
    require('@n9s/core').setPromiseFactory($q)
  }
}
