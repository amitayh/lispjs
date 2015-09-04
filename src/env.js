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

/**
 * Enrich the default environment with common definitions
 */
var buildEnv = [
  /**
   * Helper macro for defining functions:
   *
   * ['defun', 'fn', ['arg'],
   *   ['body', 'arg']]
   *
   * Will expand to:
   *
   * ['define', 'fn',
   *   ['lambda', ['arg'],
   *     ['body', 'arg']]]
   */
  ['defmacro', 'defun', ['name', 'args', 'body'],
    ['list',
      ['quote', 'define'],
      'name',
      ['list',
        ['quote', 'lambda'],
        'args',
        'body']]],

  // Check if argument is zero
  ['defun', 'zero', ['n'],
    ['=', 'n', 0]],

  // Check if collection is empty
  ['defun', 'empty', ['coll'],
    ['zero', ['size', 'coll']]],

  // Check if argument is even
  ['defun', 'even', ['n'],
    ['zero', ['%', 'n', 2]]],

  // Check if argument is odd
  ['defun', 'odd', ['n'],
    ['not', ['even', 'n']]],

  // Increase argument by 1
  ['defun', 'inc', ['n'],
    ['+', 'n', 1]],

  // Decrease argument by 1
  ['defun', 'dec', ['n'],
    ['-', 'n', 1]],

  // Get the element in collection by index
  ['defun', 'nth', ['coll', 'index'],
    ['if', ['zero', 'index'],
      ['car', 'coll'],
      ['nth', ['cdr', 'coll'], ['dec', 'index']]]],

  // Drop first n elements from collection
  ['defun', 'drop', ['n', 'coll'],
    ['if', ['zero', 'n'],
      'coll',
      ['drop', ['dec', 'n'], ['cdr', 'coll']]]],

  // Take first n elements from collection
  ['defun', 'take-nth', ['n', 'coll'],
    ['if', ['empty', 'coll'],
      'coll',
      ['cons',
        ['car', 'coll'],
        ['take-nth', 'n', ['drop', 'n', 'coll']]]]],

  // Map a collection with function f
  ['defun', 'map', ['f', 'coll'],
    ['if', ['empty', 'coll'],
      'coll',
      ['cons',
        ['f', ['car', 'coll']],
        ['map', 'f', ['cdr', 'coll']]]]],

  // Filter a collection with predicate
  ['defun', 'filter', ['pred', 'coll'],
    ['if', ['empty', 'coll'],
      'coll',
      ['if', ['pred', ['car', 'coll']],
        ['cons', ['car', 'coll'], ['filter', 'pred', ['cdr', 'coll']]],
        ['filter', 'pred', ['cdr', 'coll']]]]],

  // Create a lexical scope with bound arguments and execute body in context
  ['defmacro', 'let', ['bindings', 'body'],
    ['concat',
      ['list',
        ['list',
          ['quote', 'lambda'],
          ['take-nth', 2, 'bindings'],
          'body']],
      ['take-nth', 2, ['cdr', 'bindings']]]]
];

/**
 * Build default environment
 */
function getDefaultEnv() {
  var env = utils.copy(defaultEnv);
  buildEnv.forEach(function (expr) {
    interpreter.evaluate(expr, env);
  });
  return env;
}

module.exports = {
  getDefaultEnv: getDefaultEnv
};
