var constants = require('./constants');

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

function isBound(expr, env) {
  return (typeof expr === 'string' && env[expr] !== undefined);
}

function isSpecialForm(func) {
  return func[constants.specialFormProp] !== undefined;
}

module.exports = {
  evaluate: evaluate
};
