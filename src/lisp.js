function evaluate(expr, env) {
  if (isBound(expr, env)) {
    return [env[expr], env];
  }
  if (Array.isArray(expr)) {
    var func = expr[0];
    if (func === 'define') {
      return define(expr, env);
    }
    if (func === 'func') {
      return closure(expr[1], expr[2], env);
    }
    if (func === 'if') {
      return branch(expr[1], expr[2], expr[3], env);
    }
    return invoke(func, expr.slice(1), env);
  }
  return [expr, env];
}

function getResult(expr, env) {
  return evaluate(expr, env)[0];
}

function getResultMulti(prog, env) {
  var result = [null, env];
  prog.forEach(function (expr) {
    result = evaluate(expr, result[1]);
  });
  return result[0];
}

function isBound(expr, env) {
  return (typeof expr === 'string' && env[expr] !== undefined);
}

function define(expr, env) {
  var name = expr[1];
  var newEnv = copy(env);
  newEnv[name] = getResult(expr[2], env);
  return [null, newEnv];
}

function closure(argsList, body, env) {
  var result = function () {
    var closureEnv = copy(this);
    merge(closureEnv, env);
    for (var i = 0; i < arguments.length; i++) {
      closureEnv[argsList[i]] = arguments[i];
    }
    return getResult(body, closureEnv);
  };
  return [result, env];
}

function branch(cond, then, otherwise, env) {
  var result = getResult(cond, env) ?
    getResult(then, env) :
    getResult(otherwise, env);
  return [result, env];
}

function invoke(func, args, env) {
  var evaluatedArgs = args.map(function (arg) {
    return getResult(arg, env);
  });
  var result = env[func].apply(env, evaluatedArgs);
  return [result, env];
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
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

module.exports = {
  evaluate: evaluate,
  getResult: getResult,
  getResultMulti: getResultMulti
};