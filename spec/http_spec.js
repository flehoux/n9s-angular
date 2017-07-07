/* global describe it expect jasmine afterEach */

describe('A simple model backed by a REST service through the Angular mixin', function () {
  const {Model, Storage} = require('nucleotides')
  const HttpMixin = require('../http')
  const httpSpy = jasmine.createSpy()
  const storage = {}

  let i = 0
  const idGetter = () => (i++).toString()

  const router = {
    GET: function (arg) {
      httpSpy('GET', arg)
      let [id] = arg.url.split('/').slice(-1)
      return {
        data: storage[id],
        status: 200
      }
    },
    POST: function (arg) {
      httpSpy('POST', arg)
      let data = Object.assign({}, arg.data)
      if (arg.nas == null) {
        data.nas = idGetter()
      }
      storage[data.nas] = data
      return {
        data: data,
        status: 201
      }
    },
    PUT: function (arg) {
      httpSpy('PUT', arg)
      let data = Object.assign({}, arg.data)
      storage[data.nas] = data
      return {
        data: Object.assign({}, arg.data),
        status: 200
      }
    },
    DELETE: function (arg) {
      httpSpy('DELETE', arg)
      let [id] = arg.url.split('/').slice(-1)
      delete storage[id]
      return {
        data: null,
        status: 204
      }
    }
  }

  afterEach(function () {
    httpSpy.calls.reset()
  })

  var Person = Model('Person')
    .set(Storage.$$idKey, 'nas')
    .attributes({
      firstName: String,
      lastName: String,
      nas: String
    })
    .use(new HttpMixin({
      $http: function (arg) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(router[arg.method](arg))
          }, 50)
        })
      },
      url: 'http://localhost:8000',
      id: 'nas'
    }))

  it('should send POST request to support <Model>.create()', function (done) {
    let data = {nas: idGetter(), firstName: 'John', lastName: 'Smith'}
    Person.create(data).then(function (person) {
      expect(httpSpy.calls.count()).toBe(1)
      let [method, request] = httpSpy.calls.argsFor(0)
      let response = person.$response
      expect(person.$isNew).toBe(false)
      expect(method).toBe('POST')
      expect(response.data.status).toBe(201)
      expect(request.data).toEqual(data)
      done()
    })
  })

  it("should set the object's id if it is provided by the backend's response", function (done) {
    let data = {firstName: 'Larry', lastName: 'Scott'}
    Person.create(data).then(function (person) {
      expect(httpSpy.calls.count()).toBe(1)
      let [method, request] = httpSpy.calls.argsFor(0)
      let response = person.$response
      expect(person.nas).toBeDefined()
      expect(person.$isNew).toBe(false)
      expect(method).toBe('POST')
      expect(response.data.status).toBe(201)
      expect(request.data).toEqual(data)
      done()
    })
  })

  it('should sent GET request to support <Model>.findOne(id)', function (done) {
    let key = Object.keys(storage)[0]
    Person.findOne(key).then(function (person) {
      expect(httpSpy.calls.count()).toBe(1)
      let [method, request] = httpSpy.calls.argsFor(0)
      let response = person.$response
      expect(method).toBe('GET')
      expect(person.$clean).toEqual(storage[key])
      expect(person.$isNew).toBe(false)
      expect(response.data.status).toBe(200)
      expect(request.url).toBe(`http://localhost:8000/${key}`)
      expect(request.params).not.toBeDefined()
      expect(request.data).not.toBeDefined()
      done()
    })
  })

  it('should include optional parameters in GET request for <Model>.findOne(id, params)', function (done) {
    let key = Object.keys(storage)[0]
    Person.findOne(key, {foo: 'bar'}).then(function (person) {
      expect(httpSpy.calls.count()).toBe(1)
      let [method, request] = httpSpy.calls.argsFor(0)
      let response = person.$response
      expect(person.$clean).toEqual(storage[key])
      expect(method).toBe('GET')
      expect(person.$isNew).toBe(false)
      expect(response.data.status).toBe(200)
      expect(request.url).toBe(`http://localhost:8000/${key}`)
      expect(request.params).toEqual({foo: 'bar'})
      expect(request.data).not.toBeDefined()
      done()
    })
  })

  it('should send PUT request for <Model>.save()', function (done) {
    let key = Object.keys(storage)[1]
    Person.findOne(key).then(function (person) {
      expect(person.$isNew).toBe(false)
      person.firstName = 'Johny'
      person.save().then(function (person2) {
        let response = person.$response
        expect(storage[key].firstName).toBe('Johny')
        expect(person2).toBe(person)
        expect(response.data.status).toBe(200)
        done()
      })
    })
  })

  it('should include optional parameters in PUT request for <Model>.save(params)', function (done) {
    let key = Object.keys(storage)[1]
    Person.findOne(key).then(function (person) {
      expect(person.$isNew).toBe(false)
      person.firstName = 'Johny'
      httpSpy.calls.reset()
      person.save({foo: 'bar'}).then(function (person2) {
        let response = person.$response
        let [method, request] = httpSpy.calls.argsFor(0)
        expect(request.params).toEqual({foo: 'bar'})
        expect(storage[key].firstName).toBe('Johny')
        expect(person2).toBe(person)
        expect(method).toBe('PUT')
        expect(response.data.status).toBe(200)
        done()
      })
    })
  })

  it('should send DELETE request for <Model>.remove()', function (done) {
    let key = Object.keys(storage)[1]
    Person.findOne(key).then(function (person) {
      httpSpy.calls.reset()
      person.remove().then(function (response) {
        let [method] = httpSpy.calls.argsFor(0)
        expect(method).toBe('DELETE')
        expect(storage[key]).not.toBeDefined()
        expect(response.data.status).toBe(204)
        done()
      })
    })
  })

  it('should include optional parameters in DELETE request for <Model>.remove(params)', function (done) {
    let key = Object.keys(storage)[1]
    Person.findOne(key).then(function (person) {
      httpSpy.calls.reset()
      person.remove({foo: 'bar'}).then(function (response) {
        let [method, request] = httpSpy.calls.argsFor(0)
        expect(method).toBe('DELETE')
        expect(request.params).toEqual({foo: 'bar'})
        expect(storage[key]).not.toBeDefined()
        expect(response.data.status).toBe(204)
        done()
      })
    })
  })
})
