function evaluate(expr, env) {
  if (isBound(expr, env)) {
    return [env[expr], env];
  }
  if (Array.isArray(expr)) {
    var func = expr[0];
    switch (func) {
      case 'define': return [null, define(expr, env)];
      case 'func': return [closure(expr[1], expr[2]), env];
      case 'if': return [branch(expr[1], expr[2], expr[3], env), env];
      case 'quote': return [expr[1], env];
      default: return [invoke(func, expr.slice(1), env), env];
    }
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
  return newEnv;
}

function closure(argsList, body) {
  return function () {
    var env = copy(this);
    for (var i = 0; i < arguments.length; i++) {
      env[argsList[i]] = arguments[i];
    }
    return getResult(body, env);
  };
}

function branch(cond, then, otherwise, env) {
  return getResult(cond, env) ? getResult(then, env) : getResult(otherwise, env);
}

function invoke(func, args, env) {
  var evaluatedArgs = args.map(function (arg) {
    return getResult(arg, env);
  });
  return env[func].apply(env, evaluatedArgs);
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

module.exports = {
  evaluate: evaluate,
  getResult: getResult,
  getResultMulti: getResultMulti
};