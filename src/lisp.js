/**
 * Evaluate an expression with given environment.
 * Returns a tuple [result, env] - with evaluation result and new environment
 */
function evaluate(expr, env) {
  if (isBound(expr, env)) {
    return [env[expr], env];
  }
  if (Array.isArray(expr)) {
    switch (expr[0]) {
      case 'define': return [null, define(expr[1], expr[2], env)];
      case 'defmacro': return [null, defmacro(expr[1], expr[2], expr[3], env)];
      case 'lambda': return [lambda(expr[1], expr[2]), env];
      case 'if': return [branch(expr[1], expr[2], expr[3], env), env];
      case 'quote': return [expr[1], env];
      default: return [invoke(expr[0], expr.slice(1), env), env];
    }
  }
  return [expr, env];
}

/**
 * Evaluate an expression with given environment.
 * Returns just the evaluation result
 */
function getResult(expr, env) {
  return evaluate(expr, env)[0];
}

/**
 * Run a program in with default environment.
 * A program is a list of expressions.
 * Returns the evaluation result of the last expression
 */
function run(prog) {
  var result = [null, defaultEnv];
  prog.forEach(function (expr) {
    result = evaluate(expr, result[1]);
  });
  return result[0];
}

function isBound(expr, env) {
  return (typeof expr === 'string' && env[expr] !== undefined);
}

function define(name, expr, env) {
  var newEnv = copy(env);
  newEnv[name] = getResult(expr, env);
  return newEnv;
}

function lambda(argsNames, body) {
  return function () {
    var env = bindArguments(this, argsNames, arguments);
    return getResult(body, env);
  };
}

function defmacro(name, argsNames, body, env) {
  var newEnv = copy(env);
  var macro = function () {
    var macroEnv = bindArguments(this, argsNames, arguments);
    var evaluatedBody = getResult(body, macroEnv);
    return getMacroResult(evaluatedBody, newEnv);
  };
  macro.isMacro = true; // Tag function as macro
  newEnv[name] = macro;
  return newEnv;
}

function getMacroResult(expr, env) {
  var result = evaluate(expr, env);
  merge(env, result[1]);
  return result[0];
}

function bindArguments(env, argsNames, args) {
  var newEnv = copy(env);
  for (var i = 0; i < args.length; i++) {
    newEnv[argsNames[i]] = args[i];
  }
  return newEnv;
}

function branch(cond, then, otherwise, env) {
  return getResult(cond, env) ? getResult(then, env) : getResult(otherwise, env);
}

function invoke(name, args, env) {
  var func = getResult(name, env);
  if (typeof func !== 'function') {
    throw new Error("'" + name + "' is not a function");
  }
  if (!func.isMacro) {
    // Evaluate arguments if function is not a macro
    args = args.map(function (arg) {
      return getResult(arg, env);
    });
  }
  return func.apply(env, args);
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

var defaultEnv = {
  '<': function (a, b) { return a < b; },
  '>': function (a, b) { return a > b; },
  '=': function (a, b) { return a == b; },
  '+': function (a, b) { return a + b; },
  '-': function (a, b) { return a - b; },
  '*': function (a, b) { return a * b; },
  '/': function (a, b) { return a / b; },
  and: function (a, b) { return a && b; },
  or: function (a, b) { return a || b; },
  not: function (expr) { return !expr; },
  car: function (xs) { return xs[0]; },
  cdr: function (xs) { return xs.slice(1); },
  cons: function (x, xs) { return [x].concat(xs); },
  empty: function (xs) { return xs.length == 0; },
  list: function () { return Array.prototype.slice.call(arguments); }
};

module.exports = {
  defaultEnv: defaultEnv,
  evaluate: evaluate,
  getResult: getResult,
  run: run
};
