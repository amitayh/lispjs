# lispjs [![Build Status](https://travis-ci.org/amitayh/lispjs.svg?branch=master)](https://travis-ci.org/amitayh/lispjs)

Simple Lisp implementation in JavaScript. [Web REPL demo](http://amitayh.github.io/lispjs/)

> Note: this is an experimental library for educational purposes only

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

## Example programs

```javascript
var interpreter = require('./interpreter');
var core = require('./core');

function run(prog) {
  console.log(interpreter.run(prog, core.env));
}

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
run(fib); // Prints 8

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
run(fact); // Prints 120

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

  // Define some collection
  ['define', 'coll', ['quote', [1, 2, 3]]],

  // Map collection with 'inc'
  ['map', 'inc', 'coll']
];
run(map); // Prints [2, 3, 4]

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
run(contains); // Prints true
```
