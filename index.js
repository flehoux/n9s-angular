const {Mixin, Storage} = require('nucleotides')
const [GET, POST, PUT, DELETE] = ['GET', 'POST', 'PUT', 'DELETE']

function buildRequest (mixin, method, object, params) {
  let url = mixin.getUrl(method, object, params)
  let options = Object.assign({}, mixin.options, {url, method})

  if (method === POST || method === PUT) {
    options.data = object.clean
  }
  options.params = params

  return mixin.$http(options)
}

function normalizeAngularResponse (mixin, model, response, generate = false) {
  if (response.status < 400) {
    let result
    if (generate) {
      if (response.data != null && response.data instanceof Array) {
        result = response.data.map((object) => {
          return Reflect.construct(model, [object])
        })
      } else {
        result = Reflect.construct(model, [response.data])
      }
    } else {
      result = response.data
    }
    return new Storage.Success(response.status, result, response, mixin)
  } else {
    return new Storage.Failure(response.status, response.data, response, mixin)
  }
}

function store (mixin, flow, params) {
  if (this.$isNew) {
    buildRequest(mixin, POST, this, params).then(
      (response) => {
        let resp = normalizeAngularResponse(mixin, null, response)
        if (resp.data != null && resp.data.data != null && resp.data.data[mixin.idKey] != null) {
          this[mixin.idKey] = resp.data.data[mixin.idKey]
        }
        flow.resolve(resp)
      },
      (response) => {
        flow.reject(normalizeAngularResponse(mixin, null, response))
      }
    )
  } else {
    buildRequest(mixin, PUT, this, params).then(
      (response) => {
        flow.resolve(normalizeAngularResponse(mixin, null, response))
      },
      (response) => {
        flow.reject(normalizeAngularResponse(mixin, null, response))
      }
    )
  }
}

function remove (mixin, flow, params) {
  buildRequest(mixin, DELETE, this, params).then(
    (response) => {
      flow.resolve(normalizeAngularResponse(mixin, null, response))
    },
    (response) => {
      flow.reject(normalizeAngularResponse(mixin, null, response))
    }
  )
}

function findOne (mixin, flow, object, params) {
  if (object === null) {
    throw new Mixin.Error('You need to provide a key that will be used to find a single object', mixin)
  }
  if (typeof object === 'number') {
    object = object.toString()
  }
  if (typeof object === 'string' && mixin.idKey) {
    object = {[mixin.idKey]: object}
  }
  buildRequest(mixin, GET, object, params).then(
    (response) => {
      flow.resolve(normalizeAngularResponse(mixin, this, response, true))
    },
    (response) => {
      flow.reject(normalizeAngularResponse(mixin, this, response))
    }
  )
}

function findMany (mixin, flow, params = {}) {
  let url = mixin.baseUrl
  if (params === null) {
    params = {}
  } else if (typeof params === 'string' && typeof url === 'string') {
    url = url + params
    params = {}
  }
  buildRequest(mixin, GET, null, params).then(
    (response) => {
      flow.resolve(normalizeAngularResponse(mixin, this, response, true))
    },
    (response) => {
      flow.reject(normalizeAngularResponse(mixin, this, response))
    }
  )
}

var AngularHttpMixin = Mixin('AngularHttpMixin')
  .construct(function (options) {
    let {$http, url, id} = options

    if ($http == null || typeof $http !== 'function') {
      throw new Mixin.Error('The AngularHttpMixin mixin requires the \'$http\' option', this)
    }

    if (typeof url === 'string') {
      if (url.slice(-1) !== '/') {
        url = url + '/'
      }
    } else {
      throw new Mixin.Error('The AngularHttpMixin mixin requires the \'url\' option', this)
    }

    if (typeof id !== 'string') {
      id = 'id'
    }

    this.$http = $http
    this.baseUrl = url
    this.idKey = id
    delete options.$http
    delete options.url
    delete options.id
    this.options = options
  })
  .implement(Storage.$$store, store)
  .implement(Storage.$$remove, remove)
  .implement(Storage.$$findOne, findOne)
  .implement(Storage.$$findMany, findMany)

AngularHttpMixin.prototype.getUrl = function (method, object, params) {
  if (method === GET) {
    if (object) {
      return this.baseUrl + object[this.idKey]
    } else {
      return this.baseUrl
    }
  } else if (method === PUT || method === DELETE) {
    return this.baseUrl + object[this.idKey]
  } else if (method === POST) {
    return this.baseUrl
  }
}

var AngularMixin = Mixin('AngularMixin')
  .method('bind', function (scope, options) {
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

module.exports = {AngularHttpMixin, AngularMixin}
