var readlineSync = require('readline-sync');
var interpreter = require('./interpreter');
var env = require('./env').getDefaultEnv();

while (true) {
  // Read
  var input = readlineSync.question('> ');
  try {
    // Eval
    var expr = JSON.parse(input);
    var result = interpreter.evaluate(expr, env);
    // Print
    console.log(result);
  } catch (e) {
    console.error('Error occurred', e);
  }
  // Loop! :D
}
