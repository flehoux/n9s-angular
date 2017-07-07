const {Mixin, Model, Storage} = require('nucleotides')
const [GET, POST, PUT, DELETE] = ['GET', 'POST', 'PUT', 'DELETE']

function buildRequest (mixin, model, method, object, params) {
  let url = mixin.getUrl(method, object, params, model)
  let options = Object.assign({}, mixin.options, {url, method})

  if (method === POST || method === PUT) {
    options.data = object.$clean
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
  let idKey = Storage.idKeyFor(this.constructor)
  if (this.$isNew) {
    buildRequest(mixin, this.constructor, POST, this, params).then(
      (response) => {
        let resp = normalizeAngularResponse(mixin, null, response)
        if (resp.data != null && resp.data.data != null && resp.data.data[idKey] != null) {
          this[idKey] = resp.data.data[idKey]
        }
        flow.resolve(resp)
      },
      (response) => {
        flow.reject(normalizeAngularResponse(mixin, null, response))
      }
    )
  } else {
    buildRequest(mixin, this.constructor, PUT, this, params).then(
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
  buildRequest(mixin, this.constructor, DELETE, this, params).then(
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
  let idKey = Storage.idKeyFor(this)
  if (typeof object === 'string' && idKey) {
    object = {[idKey]: object}
  }
  buildRequest(mixin, this, GET, object, params).then(
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
  buildRequest(mixin, this, GET, null, params).then(
    (response) => {
      flow.resolve(normalizeAngularResponse(mixin, this, response, true))
    },
    (response) => {
      flow.reject(normalizeAngularResponse(mixin, this, response))
    }
  )
}

var HttpMixin = Mixin('HttpMixin')
  .construct(function (options) {
    let {$http, url} = options

    if ($http == null || typeof $http !== 'function') {
      throw new Mixin.Error('The HttpMixin mixin requires the \'$http\' option', this)
    }

    if (typeof url === 'string') {
      if (url.slice(-1) !== '/') {
        url = url + '/'
      }
    } else {
      throw new Mixin.Error('The HttpMixin mixin requires the \'url\' option', this)
    }

    this.$http = $http
    this.baseUrl = url
    delete options.$http
    delete options.url
    this.options = options
  })
  .implement(Storage.$$store, store)
  .implement(Storage.$$remove, remove)
  .implement(Storage.$$findOne, findOne)
  .implement(Storage.$$findMany, findMany)

HttpMixin.prototype.getUrl = function (method, object, params, model) {
  let id
  if (Model.isInstance(object)) {
    id = Storage.idFor(object)
  } else if (object != null && Model.isModel(model)) {
    id = object[Storage.idKeyFor(model)]
  }
  if (method === GET) {
    if (id) {
      return this.baseUrl + id
    } else {
      return this.baseUrl
    }
  } else if (method === PUT || method === DELETE) {
    return this.baseUrl + id
  } else if (method === POST) {
    return this.baseUrl
  }
}

module.exports = HttpMixin
