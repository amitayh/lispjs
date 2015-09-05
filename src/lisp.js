var interpreter = require('./interpreter');
var env = require('./env');

var getDefaultEnv = env.getDefaultEnv;

/**
 * Run a program with default environment.
 * A program is a list of expressions.
 * Returns the evaluation result of the last expression.
 */
function run(prog) {
  var env = getDefaultEnv(), result = null;
  prog.forEach(function (expr) {
    result = interpreter.evaluate(expr, env);
  });
  return result;
}

module.exports = {
  run: run
};
