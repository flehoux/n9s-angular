# n9s-angular
Angular Mixins for [Nucleotides.js][1]

![Travis](https://travis-ci.org/matehat/n9s-angular.svg?branch=master)

## Usage

```javascript
angular
.module('myapp.person', [])
.factory('Person', function ($http) {
  let Angular = require('@n9s/angular')
  let {Model} = require('@n9s/core')

  let Person = Model('Person')
    .attributes({
      id: String,
      firstName: String,
      lastName: String
    })
    .use(new Angular.HttpMixin({$http, url: 'http://127.0.0.1/people'}))
    .use(new Angular.ScopeMixin)

  return Person
})

// Elsewhere

angular
.module('myapp.controller', ['myapp.person'])
.constroller('createUser', function (Person, $scope) {
  $scope.person = new Person({id: '1', firstName: 'Larry', lastName: 'Smith'}) // => Issues a POST request

  $scope.person.bindToScope($scope) // Ensures that change events are in sync with Angular's digest cycles,
                                    // and that the event listeners are discarded when the scope is destroyed

  $scope.person.then(function (person) {
    person.firsName = 'John'
    person.save() // => Issues a PUT request
    person.remove() // => Issues a DELETE request
  })

  Person.findOne('1')
        .then(function (person) {  }) // => Issues a GET request to http://127.0.0.1/people/1

  Person.findAll({deleted: true})
        .then(function (person) {  }) // => Issues a GET request to http://127.0.0.1/people?deleted=true
})
```

[1]: https://github.com/matehat/nucleotides.js
