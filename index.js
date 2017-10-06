module.exports = {
  HttpMixin: require('./http'),
  ScopeMixin: require('./scope'),
  patchPromises: function ($q) {
    require('nucleotides').setPromiseFactory($q)
  }
}
