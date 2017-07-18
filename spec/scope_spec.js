/* global describe it expect jasmine */

const {Model, makeEmitter, Protocol, Mixin} = require('nucleotides')
const ScopeMixin = require('../scope')

const Person = Model('Person')
  .attributes({
    firstName: String,
    lastName: String,
    id: String
  })
  .implement(Protocol.Queryable.store, function (flow, object) {
    return flow.resolve(new Protocol.Queryable.Success())
  })
  .use(new Mixin.AutoUpdate())
  .use(new ScopeMixin())

class ScopeMock {
  constructor () {
    this.spy = jasmine.createSpy('ScopeMock')
  }
  $applyAsync () {
    this.spy()
  }
  $destroy () {
    this.$emit('$destroy')
  }
}

makeEmitter(ScopeMock.prototype)

describe('A Model instance bound to a Angular Scope', function () {
  it('should trigger a digest cycle upon changes to any attribute', function () {
    let john = new Person({firstName: 'John', lastName: 'Smith'})
    let scope = new ScopeMock()
    john.bindToScope(scope)
    john.lastName = 'McCarthy'
    expect(scope.spy).toHaveBeenCalled()
  })

  it('should not trigger a digest cycle after the scope has been destroyed', function () {
    let john = new Person({firstName: 'John', lastName: 'Smith'})
    let scope = new ScopeMock()
    john.bindToScope(scope)
    scope.$destroy()
    john.lastName = 'McCarthy'
    expect(scope.spy).not.toHaveBeenCalled()
  })

  it('should automatically trigger $autoUpdate on the model instance being bound to a scope', function (done) {
    let john = new Person({firstName: 'John', lastName: 'Smith', id: '1'})
    let john2 = new Person({firstName: 'John', lastName: 'Smith', id: '1'})
    let scope = new ScopeMock()
    john.bindToScope(scope, {autoUpdate: true})
    john2.lastName = 'McCarthy'
    john2.$save().then(function () {
      expect(john.lastName).toBe('McCarthy')
      expect(scope.spy).toHaveBeenCalled()
      done()
    })
  })
})

describe('A Collection of Model instances, bound to a Angular Scope', function () {
  it('should trigger a digest cycle upon changes to any element', function () {
    let coll = Person.createCollection()
    coll.push({firstName: 'John', lastName: 'Smith', id: '2'})
    let person = coll[0]
    let scope = new ScopeMock()
    coll.bindToScope(scope)
    person.lastName = 'McCarthy'
    expect(scope.spy).toHaveBeenCalled()
  })

  it('should trigger a digest cycle upon element addition', function () {
    let coll = Person.createCollection()
    let scope = new ScopeMock()
    coll.bindToScope(scope)
    coll.push({firstName: 'John', lastName: 'Smith'})
    expect(scope.spy).toHaveBeenCalled()
  })

  it('should trigger a digest cycle upon element removal', function () {
    let coll = Person.createCollection()
    coll.push({firstName: 'John', lastName: 'Smith'})
    let scope = new ScopeMock()
    coll.bindToScope(scope)
    let person = coll.pop()
    expect(person.firstName).toBe('John')
    expect(scope.spy).toHaveBeenCalled()
  })

  it('should not trigger a digest cycle after the scope has been destroyed', function () {
    let coll = Person.createCollection()
    coll.push({firstName: 'John', lastName: 'Smith'})
    let john = coll[0]
    let scope = new ScopeMock()
    coll.bindToScope(scope)
    scope.$destroy()
    john.lastName = 'McCarthy'
    expect(scope.spy).not.toHaveBeenCalled()
  })

  it('should automatically call $autoUpdate on the collection being bound to a scope', function (done) {
    let coll = Person.createCollection()
    coll.push({firstName: 'John', lastName: 'Smith', id: '1'})
    let john = new Person({firstName: 'John', lastName: 'Smith', id: '1'})
    let john2 = coll[0]
    let scope = new ScopeMock()
    coll.bindToScope(scope)
    john.lastName = 'McCarthy'
    john.$save().then(function () {
      expect(john2.lastName).toBe('McCarthy')
      expect(scope.spy).toHaveBeenCalled()
      done()
    })
  })
})
