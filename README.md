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
```

(more examples in [here](specs/lisp-specs.js) and [here](src/env.js))