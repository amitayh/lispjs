var interpreter = require('./interpreter');
var env = require('./env');

var getDefaultEnv = env.getDefaultEnv;

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
