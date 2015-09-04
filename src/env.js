var interpreter = require('./interpreter');
var forms = require('./forms');
var utils = require('./utils');

var defaultEnv = {
  lambda: forms.lambda,
  define: forms.define,
  defmacro: forms.defmacro,
  quote: forms.quote,
  'if': forms.if,
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
  size: function (xs) { return xs.length; },
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

  ['defun', 'empty', ['coll'],
    ['=', ['size', 'coll'], 0]],

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

  ['defun', 'drop', ['n', 'coll'],
    ['if', ['=', 'n', 0],
      'coll',
      ['drop', ['dec', 'n'], ['cdr', 'coll']]]],

  ['defun', 'take-nth', ['n', 'coll'],
    ['if', ['empty', 'coll'],
      'coll',
      ['cons',
        ['car', 'coll'],
        ['take-nth', 'n', ['drop', 'n', 'coll']]]]],

  ['defun', 'map', ['f', 'coll'],
    ['if', ['empty', 'coll'],
      'coll',
      ['cons',
        ['f', ['car', 'coll']],
        ['map', 'f', ['cdr', 'coll']]]]],

  ['defmacro', 'let', ['bindings', 'body'],
    ['concat',
      ['list',
        ['list',
          ['quote', 'lambda'],
          ['take-nth', 2, 'bindings'],
          'body']],
      ['take-nth', 2, ['cdr', 'bindings']]]]
];

function getDefaultEnv() {
  var env = utils.copy(defaultEnv);
  buildEnv.forEach(function (expr) {
    interpreter.evaluate(expr, env);
  });
  return env;
}

module.exports = {
  getDefaultEnv: getDefaultEnv,
  buildEnv: buildEnv
};
