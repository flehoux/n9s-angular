const {Mixin, Protocol} = require('nucleotides')
const {Queryable, Identifiable, Storable} = Protocol
const [GET, POST, PUT, DELETE] = ['GET', 'POST', 'PUT', 'DELETE']

function buildRequest (mixin, model, method, object, params) {
  let url = Identifiable.urlFor(model, method, object)
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
          return Storable.decode(model, object)
        })
      } else {
        result = Storable.decode(model, response.data)
      }
    } else {
      result = response.data
    }
    return new Queryable.Success(response.status, result, response, mixin)
  } else {
    return new Queryable.Failure(response.status, response.data, response, mixin)
  }
}

function store (mixin, flow, params) {
  let idKey = Identifiable.idKeyFor(this.constructor)
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
  let idKey = Identifiable.idKeyFor(this)
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
  .require(Identifiable)
  .construct(function (options) {
    let {$http} = options

    if ($http == null || typeof $http !== 'function') {
      throw new Mixin.Error('The Angular.HttpMixin mixin requires the \'$http\' option', this)
    }

    this.$http = $http
    delete options.$http
    this.options = options
  })
  .implement(Queryable.store, store)
  .implement(Queryable.remove, remove)
  .implement(Queryable.findOne, findOne)
  .implement(Queryable.findMany, findMany)

module.exports = HttpMixin
