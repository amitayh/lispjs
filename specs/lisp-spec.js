var assert = require('assert');
var interpreter = require('../src/interpreter');
var env = require('../src/env');

describe('lispjs', function () {

  function identity(arg) {
    return arg;
  }

  function constantly(value) {
    return function () {
      return value;
    };
  }

  var getDefaultEnv = env.getDefaultEnv;

  function evaluate(expr, env) {
    env = env || getDefaultEnv();
    return interpreter.evaluate(expr, env);
  }

  function run(prog) {
    var env = getDefaultEnv(), value = null;
    prog.forEach(function (expr) {
      value = interpreter.evaluate(expr, env);
    });
    return value;
  }

  describe('simple evaluation', function () {
    it('evaluates simple values as themselves', function () {
      var exprs = [1, 'foo', true, {foo: 'bar'}];
      exprs.forEach(function (expr) {
        assert.strictEqual(evaluate(expr), expr);
      });
    });

    it('evaluates bound symbols to their values', function () {
      var expr = 'foo';
      var env = {foo: 'bar'};
      assert.equal(evaluate(expr, env), 'bar');
    });
  });

  describe('function invocation', function () {
    it('invokes a function without arguments', function () {
      var expr = ['foo'];
      var env = {foo: constantly('bar')};
      assert.equal(evaluate(expr, env), 'bar');
    });

    it('invokes a function with arguments', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity};
      assert.equal(evaluate(expr, env), 'bar');
    });

    it('evaluates function arguments before invoking a function', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity, bar: 'baz'};
      assert.equal(evaluate(expr, env), 'baz');
    });

    it('invokes anonymous functions', function () {
      var expr = [['lambda', ['a', 'b'], ['+', 'a', 'b']], 1, 2];
      assert.equal(evaluate(expr), 3);
    });
  });

  describe('define', function () {
    it('binds values in environment', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        'foo'
      ];
      assert.equal(run(prog), 'bar');
    });

    it('evaluates values', function () {
      var prog = [
        ['define', 'bar', 'baz'],
        ['define', 'foo', 'bar'],
        'foo'
      ];
      assert.equal(run(prog), 'baz');
    });
  });

  describe('if', function () {
    it('returns first form if condition evaluates to true', function () {
      var expr = ['if', true, 'foo', 'bar'];
      assert.equal(evaluate(expr), 'foo');
    });

    it('returns second form if condition evaluates to false', function () {
      var expr = ['if', false, 'foo', 'bar'];
      assert.equal(evaluate(expr), 'bar');
    });

    it('evaluates first form if condition evaluates to true', function () {
      var prog = [
        ['define', 'then', 'foo'],
        ['if', true, 'then', 'otherwise']
      ];
      assert.equal(run(prog), 'foo');
    });

    it('evaluates first form if condition evaluates to true', function () {
      var prog = [
        ['define', 'otherwise', 'bar'],
        ['if', false, 'then', 'otherwise']
      ];
      assert.equal(run(prog), 'bar');
    });

    it('evaluates condition before branching', function () {
      var prog = [
        ['define', 'cond', false],
        ['if', 'cond', 'foo', 'bar']
      ];
      assert.equal(run(prog), 'bar');
    });
  });

  describe('quote', function () {
    it('returns passed value without evaluation', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['quote', ['foo']]
      ];
      assert.deepEqual(run(prog), ['foo']);
    });
  });

  describe('lambdas', function () {
    it('defines simple function without arguments', function () {
      var prog = [
        ['define', 'foo', ['lambda', [], 'bar']],
        ['foo']
      ];
      assert.equal(run(prog), 'bar');
    });

    it('binds arguments to call values', function () {
      var prog = [
        ['define', 'foo', ['lambda', ['arg'], 'arg']],
        ['foo', 'bar']
      ];
      assert.equal(run(prog), 'bar');
    });

    it('supports lexical scope', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', [], 'foo']],
        ['bar']
      ];
      assert.equal(run(prog), 'bar');
    });

    it('supports currying', function () {
      var prog = [
        ['define', 'foo',
          ['lambda', ['a'],
            ['lambda', ['b'],
              ['+', 'a', 'b']]]],

        [['foo', 1], 2]
      ];
      assert.equal(run(prog), 3);
    });

    it('gives local scope higher priority', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', ['foo'], 'foo']],
        ['bar', 'baz']
      ];
      assert.equal(run(prog), 'baz');
    });

    it('throws when trying to invoke a symbol which is not bound to a function', function () {
      function block() {
        var prog = [
          ['define', 'foo', 'bar'],
          ['foo']
        ];
        run(prog);
      }
      assert.throws(block, /'foo' is not a function/);
    });
  });

  describe('macros', function () {
    it('enables simple macros', function () {
      var prog = [
        ['defmacro', 'infix', ['expr'],
          ['list',
            ['nth', 'expr', 1],
            ['nth', 'expr', 0],
            ['nth', 'expr', 2]]],

        ['infix', [1, '+', 2]]
      ];
      assert.equal(run(prog), 3);
    });

    it('defines the let bindings macro in core environment', function () {
      var expr = ['let', ['a', 1, 'b', 2], ['+', 'a', 'b']];
      assert.equal(evaluate(expr), 3);
    });
  });

  describe('programs tests', function () {
    it('calculates fibonacci recursively', function () {
      var fib =
        ['defun', 'fib', ['n'],
          ['if', ['<', 'n', 2],
            1,
            ['+',
              ['fib', ['-', 'n', 1]],
              ['fib', ['-', 'n', 2]]]]];

      var env = getDefaultEnv();
      evaluate(fib, env);

      var tests = [
        {input: 0, output: 1},
        {input: 1, output: 1},
        {input: 2, output: 2},
        {input: 3, output: 3},
        {input: 4, output: 5},
        {input: 5, output: 8}
      ];
      tests.forEach(function (test) {
        assert.equal(evaluate(['fib', test.input], env), test.output);
      });
    });

    it('supports higher order functions (map)', function () {
      var prog = [
        // Define some collection
        ['define', 'coll', ['list', 1, 2, 3]],

        // Map collection with 'inc'
        ['map', 'inc', 'coll']
      ];

      assert.deepEqual(run(prog), [2, 3, 4]);
    });
  });

});
