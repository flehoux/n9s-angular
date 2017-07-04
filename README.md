# n9s-angular
Angular Mixin for [Nucleotides.js][1]

## Usage

```javascript
angular
.module('myapp.person', [])
.factory('Person', function ($http) {
  let {AngularHttpMixin} = require('n9s-angular')
  let {Model} = require('nucleotides')

  let Person = Model('Person')
    .attributes({
      id: String,
      firstName: String,
      lastName: String
    })
    .use(new AngularHttpMixin({$http, url: 'http://127.0.0.1/people'}))
    
  return Person
})

// Elsewhere

Person.create({id: '1', firstName: 'Larry', lastName: 'Smith'}) // => Issues a POST request
.then(function (person) {
  person.firsName = 'John'
  person.save() // => Issues a PUT request
  person.remove() // => Issues a DELETE request
})

Person.findOne('1')
      .then(function (person) {  }) // => Issues a GET request to http://127.0.0.1/people/1
      
Person.findAll({deleted: true})
      .then(function (person) {  }) // => Issues a GET request to http://127.0.0.1/people?deleted=true
```

[1]: https://github.com/matehat/nucleotides.js
