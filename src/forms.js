var interpreter = require('./interpreter');
var constants = require('./constants');
var utils = require('./utils');

var evaluate = interpreter.evaluate;
var copy = utils.copy;

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
  return null;
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

function specialForm(func) {
  func[constants.specialFormProp] = true;
  return func;
}

function bindArguments(env, argsNames, args) {
  for (var i = 0; i < args.length; i++) {
    env[argsNames[i]] = args[i];
  }
}

module.exports = {
  lambda: specialForm(lambda),
  define: specialForm(define),
  defmacro: specialForm(defmacro),
  quote: specialForm(quote),
  'if': specialForm(branch)
};
