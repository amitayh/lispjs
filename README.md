# lispjs [![Build Status](https://travis-ci.org/amitayh/lispjs.svg?branch=master)](https://travis-ci.org/amitayh/lispjs)

Simple Lisp implementation in JavaScript. [Web REPL demo](http://amitayh.github.io/lispjs/)

## Installation

```
$ git clone https://github.com/amitayh/lispjs
$ cd lispjs
$ npm install
```

## Running tests

```
$ npm test
```

## Running a REPL in node (pretty lame... :sweat:)

```
$ npm run repl
```

## Example programs

```javascript
var lisp = require('./lisp');

// Fibonacci
var fib = [
  // Define fib function
  ['define', 'fib',
    ['lambda', ['n'],
      ['if', ['<', 'n', 2],
        1,
        ['+',
          ['fib', ['-', 'n', 1]],
          ['fib', ['-', 'n', 2]]]]]],

  // Call function
  ['fib', 5]
];
console.log(lisp.run(fib)); // Prints 8

// Factorial
var fact = [
  // Define fact function
  ['define', 'fact',
    ['lambda', ['n'],
      ['if', ['<', 'n', 2],
        1,
        ['*', 'n', ['fact', ['-', 'n', 1]]]]]],

  // Call function
  ['fact', 5]
];
console.log(lisp.run(fact)); // Prints 120

// Map
var map = [
  // Define map function
  ['define', 'map',
    ['lambda', ['f', 'coll'],
      ['if', ['empty', 'coll'],
        'coll',
        ['cons',
          ['f', ['car', 'coll']],
          ['map', 'f', ['cdr', 'coll']]]]]],

  // Define unary increment function
  ['define', 'inc',
    ['lambda', ['num'],
      ['+', 'num', 1]]],

  // Define some collection
  ['define', 'coll', ['quote', [1, 2, 3]]],

  // Map collection with 'inc'
  ['map', 'inc', 'coll']
];
console.log(lisp.run(map)); // Prints [2, 3, 4]

// Contains (checks if element exists in collection)
var contains = [
  // Define contains function
  ['define', 'contains',
    ['lambda', ['el', 'coll'],
      ['if', ['empty', 'coll'],
        false,
        ['or',
          ['=', 'el', ['car', 'coll']],
          ['contains', 'el', ['cdr', 'coll']]]]]],

  // Define some collection
  ['define', 'coll', ['quote', [1, 2, 3]]],

  // Check if collection contains 2
  ['contains', 2, 'coll']
];
console.log(lisp.run(contains)); // Prints true
```
