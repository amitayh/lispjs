var readlineSync = require('readline-sync');
var lisp = require('./lisp');

var env = lisp.defaultEnv;
while (true) {
  // Read
  var input = readlineSync.question('> ');
  try {
    // Eval
    var expr = JSON.parse(input);
    var result = lisp.evaluate(expr, env);
    // Print
    console.log(result[0]);
    env = result[1];
  } catch(e) {
    console.error('Error occurred', e);
  }
  // Loop! :D
}
