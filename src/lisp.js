function evaluate(expr, env) {
  if (isBound(expr, env)) {
    return env[expr];
  }
  if (Array.isArray(expr)) {
    return invoke(expr[0], expr.slice(1), env);
  }
  return expr;
}

function invoke(name, args, env) {
  var func = evaluate(name, env);
  if (typeof func !== 'function') {
    throw new Error("'" + name + "' is not a function");
  }
  if (!isSpecialForm(func)) {
    args = args.map(function (arg) {
      return evaluate(arg, env);
    });
  }
  return func.apply(env, args);
}

var specialFormProp = '_specialForm';
var defaultEnv = {
  lambda: specialForm(lambda),
  define: specialForm(define),
  defmacro: specialForm(defmacro),
  quote: specialForm(quote),
  'if': specialForm(branch),
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

function isBound(expr, env) {
  return (typeof expr === 'string' && env[expr] !== undefined);
}

function isSpecialForm(func) {
  return func[specialFormProp] !== undefined;
}

function getDefaultEnv() {
  var env = copy(defaultEnv);
  buildEnv.forEach(function (expr) {
    evaluate(expr, env);
  });
  return env;
}

function specialForm(func) {
  func[specialFormProp] = true;
  return func;
}

function lambda(argNames, body) {
  var env = this;
  return function () {
    var lambdaEnv = copy(env);
    bindArguments(lambdaEnv, argNames, arguments);
    return evaluate(body, lambdaEnv);
  };
}

function define(name, expr) {
  var env = this;
  env[name] = evaluate(expr, env);
}

function defmacro(name, argNames, body) {
  var env = this;
  env[name] = specialForm(function () {
    var macroEnv = copy(env);
    bindArguments(macroEnv, argNames, arguments);
    var expanded = evaluate(body, macroEnv);
    return evaluate(expanded, env);
  });
}

function quote(expr) {
  return expr;
}

function branch(cond, then, otherwise) {
  var env = this;
  var form = evaluate(cond, env) ? then : otherwise;
  return evaluate(form, env);
}

function copy(obj) {
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

function merge(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key) && target[key] === undefined) {
      target[key] = source[key];
    }
  }
}

function bindArguments(env, argsNames, args) {
  for (var i = 0; i < args.length; i++) {
    env[argsNames[i]] = args[i];
  }
}

module.exports = {
  evaluate: evaluate,
  getDefaultEnv: getDefaultEnv
};