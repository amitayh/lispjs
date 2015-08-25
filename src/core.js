var interpreter = require('./interpreter');

var defaultEnv = {
  '<': function (a, b) { return a < b; },
  '>': function (a, b) { return a > b; },
  '=': function (a, b) { return a == b; },
  '+': function (a, b) { return a + b; },
  '-': function (a, b) { return a - b; },
  '*': function (a, b) { return a * b; },
  '/': function (a, b) { return a / b; },
  '%': function (a, b) { return a % b; },
  and: function (a, b) { return a && b; },
  or: function (a, b) { return a || b; },
  not: function (expr) { return !expr; },
  car: function (xs) { return xs[0]; },
  cdr: function (xs) { return xs.slice(1); },
  cons: function (x, xs) { return [x].concat(xs); },
  concat: function(xs, ys) { return xs.concat(ys); },
  empty: function (xs) { return xs.length == 0; },
  list: function () { return Array.prototype.slice.call(arguments); }
};

var buildEnv = [
  ['defmacro', 'defun', ['name', 'args', 'body'],
    ['list',
      ['quote', 'define'],
      'name',
      ['list',
        ['quote', 'lambda'],
        'args',
        'body']]],

  ['defun', 'even', ['n'],
    ['=', ['%', 'n', 2], 0]],

  ['defun', 'odd', ['n'],
    ['not', ['even', 'n']]],

  ['defun', 'inc', ['n'],
    ['+', 'n', 1]],

  ['defun', 'dec', ['n'],
    ['-', 'n', 1]],

  ['defun', 'nth', ['coll', 'index'],
    ['if', ['=', 'index', 0],
      ['car', 'coll'],
      ['nth', ['cdr', 'coll'], ['dec', 'index']]]],

  ['defun', 'filter-index-helper', ['pred', 'coll', 'index'],
    ['if', ['empty', 'coll'],
      'coll',
      ['if', ['pred', 'index'],
        ['cons',
          ['car', 'coll'],
          ['filter-index-helper', 'pred', ['cdr', 'coll'], ['inc', 'index']]],
        ['filter-index-helper', 'pred', ['cdr', 'coll'], ['inc', 'index']]]]],

  ['defun', 'filter-index', ['pred', 'coll'],
    ['filter-index-helper', 'pred', 'coll', 0]],

  ['defmacro', 'let', ['bindings', 'body'],
    ['concat',
      ['list',
        ['list',
          ['quote', 'lambda'],
          ['filter-index', 'even', 'bindings'],
          'body']],
      ['filter-index', 'odd', 'bindings']]]
];

function run(prog) {
  var result = [null, defaultEnv];
  prog.forEach(function (expr) {
    result = interpreter.evaluate(expr, result[1]);
  });
  return result;
}

module.exports = {
  env: run(buildEnv)[1]
};
