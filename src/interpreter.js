function evaluate2(expr, env) {
  if (isBound(expr, env)) {
    return env[expr];
  }
  if (Array.isArray(expr)) {
    return invoke2(expr[0], expr.slice(1), env);
  }
  return expr;
}

function invoke2(name, args, env) {
  var func = evaluate2(name, env);
  if (typeof func !== 'function') {
    throw new Error("'" + name + "' is not a function");
  }
  if (!func.isSpecialForm) {
    args = args.map(function (arg) {
      return evaluate2(arg, env);
    });
  }
  return func.apply(env, args);
}



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
      case 'lambda': return [lambda(expr[1], expr[2], env), env];
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
 * Run a program in with environment.
 * A program is a list of expressions.
 * Returns the evaluation result of the last expression
 */
function run(prog, env) {
  var result = [null, env];
  prog.forEach(function (expr) {
    result = evaluate(expr, result[1]);
  });
  return result[0];
}

function isBound(expr, env) {
  return (typeof expr === 'string' && env[expr] !== undefined);
}

function define(name, expr, env) {
  var result = evaluate(expr, env);
  var newEnv = copy(result[1]);
  newEnv[name] = result[0];
  return newEnv;
}

function lambda(argsNames, body, env) {
  return function () {
    var lambdaEnv = copy(this);
    merge(lambdaEnv, env);
    bindArguments(lambdaEnv, argsNames, arguments);
    return getResult(body, lambdaEnv);
  };
}

function defmacro(name, argsNames, body, env) {

  //console.log(body);

  var newEnv = copy(env);
  var macro = function () {
    var macroEnv = copy(this);
    bindArguments(macroEnv, argsNames, arguments);
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
  for (var i = 0; i < args.length; i++) {
    env[argsNames[i]] = args[i];
  }
}

function branch(cond, then, otherwise, env) {
  return getResult(cond, env) ? getResult(then, env) : getResult(otherwise, env);
}

function invoke(name, args, env) {
  var result = evaluate(name, env);
  var func = result[0];
  var funcEnv = copy(result[1]);
  merge(funcEnv, env);
  if (typeof func !== 'function') {
    throw new Error("'" + name + "' is not a function");
  }
  if (!func.isMacro) {
    // Evaluate arguments if function is not a macro
    args = args.map(function (arg) {
      return getResult(arg, funcEnv);
    });
  }
  return func.apply(funcEnv, args);
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

module.exports = {
  evaluate2: evaluate2,
  evaluate: evaluate,
  getResult: getResult,
  run: run
};
