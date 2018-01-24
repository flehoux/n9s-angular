const {Mixin, Protocol} = require('@n9s/core')
const {Queryable, Identifiable, Storable} = Protocol
const [GET, POST, PUT, DELETE, PATCH] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

function joinUrlComponents (...cmps) {
  return cmps
    .filter((cmp) => typeof cmp === 'string' && cmp.length > 0)
    .map((cmp, i) => {
      if (cmp[0] === '/') cmp = cmp.slice(1)
      if (cmp.slice(-1) === '/') cmp = cmp.slice(0, -1)
      return cmp
    })
    .join('/')
}

function doStore (mixin, flow, params, extra) {
  let idKey = Identifiable.idKey(this.constructor)
  if (this.$isNew) {
    this.constructor.POST({body: this, params, extra}).then(
      (response) => {
        let resp = mixin.normalizeForQueryable(response)
        let object = resp.data
        if (object.data != null && object.data[idKey] != null) {
          this.$updateAttributes(object.data)
        }
        flow.resolve(resp)
      },
      (response) => {
        flow.reject(mixin.normalizeForQueryable(response))
      }
    )
  } else {
    this.$PUT({body: this, params, extra}).then(
      (response) => {
        flow.resolve(mixin.normalizeForQueryable(response))
      },
      (response) => {
        flow.reject(mixin.normalizeForQueryable(response))
      }
    )
  }
}

function doRemove (mixin, flow, params, extra) {
  this.$DELETE({params, extra}).then(
    (response) => {
      flow.resolve(mixin.normalizeForQueryable(response))
    },
    (response) => {
      flow.reject(mixin.normalizeForQueryable(response))
    }
  )
}

function doFindOne (mixin, flow, object, params) {
  if (object === null) {
    throw new Mixin.Error('You need to provide a key that will be used to find a single object', mixin)
  }
  let objectId
  if (typeof object === 'number') {
    objectId = object.toString()
  }
  let idKey = Identifiable.idKey(this)
  if (typeof object === 'string' && idKey) {
    objectId = object
    object = null
  }
  this.GET(objectId, {params, object, decode: true}).then(
    (response) => {
      flow.resolve(mixin.normalizeForQueryable(response))
    },
    (response) => {
      flow.reject(mixin.normalizeForQueryable(response))
    }
  )
}

function doFindMany (mixin, flow, params = {}) {
  this.GET({params, decode: true}).then(
    (response) => {
      flow.resolve(mixin.normalizeForQueryable(response))
    },
    (response) => {
      flow.reject(mixin.normalizeForQueryable(response))
    }
  )
}

function requestModelPerformer (verb) {
  return function (mixin, route, options) {
    let model = this
    const {Model} = require('@n9s/core')
    if (typeof route === 'object') {
      options = route
      route = null
    }
    if (options == null) {
      options = {}
    }
    if (Model.isInstance(options.body)) {
      options.body = Storable.encode(options.body)
    }
    if (options.extra != null) {
      options.body = Object.assign({}, options.body || {}, options.extra)
    }
    let url = joinUrlComponents(mixin.baseUrl, Identifiable.urlFor(model, verb), route)
    let promise = mixin.$http({
      method: verb,
      data: options.body,
      params: options.params,
      url
    })
    let decodedModel
    if (options.decode === true) {
      decodedModel = model
    } else if (Model.isModel(options.decode)) {
      decodedModel = options.decode
    }
    if (decodedModel != null) {
      promise = promise.then((response) => {
        if (response.data != null && response.data instanceof Array) {
          let decoded = response.data.map((object) => {
            return Storable.decode(decodedModel, object)
          })
          decoded.$response = response
          return decoded
        } else if (response.data != null) {
          let decoded = Storable.decode(decodedModel, response.data)
          decoded.$response = response
          return decoded
        }
      })
    }
    return promise
  }
}

function requestObjectPerformer (verb) {
  return function (mixin, route, options) {
    let object = this
    let model = object.constructor
    const {Model} = require('@n9s/core')
    if (typeof route === 'object') {
      options = route
      route = null
    }
    if (options == null) {
      options = {}
    }
    if (Model.isInstance(options.body)) {
      options.body = Storable.encode(options.body)
    }
    if (options.extra != null) {
      options.body = Object.assign({}, options.body || {}, options.extra)
    }
    let url = joinUrlComponents(mixin.baseUrl, Identifiable.urlFor(object, verb), route)
    let promise = mixin.$http({
      method: verb,
      data: options.body,
      params: options.params,
      url
    })
    let decodedModel
    if (options.decode === true) {
      decodedModel = model
    } else if (Model.isModel(options.decode)) {
      decodedModel = options.decode
    }
    if (decodedModel != null) {
      promise = promise.then((response) => {
        if (response.data != null && response.data instanceof Array) {
          let decoded = response.data.map((object) => {
            return Storable.decode(decodedModel, object)
          })
          decoded.$response = response
          return decoded
        } else if (response.data != null) {
          let decoded = Storable.decode(decodedModel, response.data)
          decoded.$response = response
          return decoded
        }
      })
    }
    return promise
  }
}

var HttpMixin = Mixin('HttpMixin')
  .require(Identifiable)
  .construct(function (options) {
    let {$http, baseUrl} = options

    if ($http == null || typeof $http !== 'function') {
      throw new Mixin.Error('The Angular.HttpMixin mixin requires the \'$http\' option', this)
    }

    this.$httpService = $http
    this.baseUrl = baseUrl || ''
    delete options.$http
    delete options.baseUrl
    this.options = options
  })
  .implement(Queryable.store, doStore)
  .implement(Queryable.remove, doRemove)
  .implement(Queryable.findOne, doFindOne)
  .implement(Queryable.findMany, doFindMany)
  .classMethod(GET, requestModelPerformer(GET))
  .classMethod(POST, requestModelPerformer(POST))
  .classMethod(PUT, requestModelPerformer(PUT))
  .classMethod(DELETE, requestModelPerformer(DELETE))
  .classMethod(PATCH, requestModelPerformer(PATCH))
  .method('$' + GET, requestObjectPerformer(GET))
  .method('$' + POST, requestObjectPerformer(POST))
  .method('$' + PUT, requestObjectPerformer(PUT))
  .method('$' + DELETE, requestObjectPerformer(DELETE))
  .method('$' + PATCH, requestObjectPerformer(PATCH))

HttpMixin.prototype.$http = function (overrides) {
  return this.$httpService(Object.assign({}, this.options, overrides))
}

HttpMixin.prototype.normalizeForQueryable = function (response) {
  let result
  if (response.$response) {
    result = response
    response = result.$response
  } else {
    result = response.data
  }
  if (response.status < 400) {
    return new Queryable.Success(result, response.status, response, this)
  } else {
    return new Queryable.Failure(response.data, response.status, response, this)
  }
}

module.exports = HttpMixin
