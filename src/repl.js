var readlineSync = require('readline-sync');
var interpreter = require('./interpreter');
var core = require('./core');

var env = core.env;
while (true) {
  // Read
  var input = readlineSync.question('> ');
  try {
    // Eval
    var expr = JSON.parse(input);
    var result = interpreter.evaluate(expr, env);
    // Print
    console.log(result[0]);
    env = result[1];
  } catch(e) {
    console.error('Error occurred', e);
  }
  // Loop! :D
}
