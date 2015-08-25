var assert = require('assert');
var interpreter = require('../src/interpreter');
var core = require('../src/core');

describe('lispjs', function () {

  function identity(arg) {
    return arg;
  }

  function constantly(value) {
    return function () {
      return value;
    };
  }

  describe('simple evaluation', function () {
    it('evaluates simple values as themselves', function () {
      var exprs = [1, 'foo', true, {foo: 'bar'}];
      exprs.forEach(function (expr) {
        assert.strictEqual(interpreter.getResult(expr, {}), expr);
      });
    });

    it('evaluates bound symbols to their values', function () {
      var expr = 'foo';
      var env = {foo: 'bar'};
      assert.equal(interpreter.getResult(expr, env), 'bar');
    });
  });

  describe('function invocation', function () {
    it('invokes a function without arguments', function () {
      var expr = ['foo'];
      var env = {foo: constantly('bar')};
      assert.equal(interpreter.getResult(expr, env), 'bar');
    });

    it('invokes a function with arguments', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity};
      assert.equal(interpreter.getResult(expr, env), 'bar');
    });

    it('evaluates function arguments before invoking a function', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity, bar: 'baz'};
      assert.equal(interpreter.getResult(expr, env), 'baz');
    });

    it('invokes anonymous functions', function () {
      var expr = [['lambda', ['a', 'b'], ['+', 'a', 'b']], 1, 2];
      assert.equal(interpreter.getResult(expr, core.env), 3);
    });
  });

  describe('define', function () {
    it('binds values in environment', function () {
      var expr = ['define', 'foo', 'bar'];
      assert.deepEqual(interpreter.evaluate(expr, {}), [null, {foo: 'bar'}]);
    });

    it('does not mutate the original environment', function () {
      var env = {};
      var expr = ['define', 'foo', 'bar'];
      interpreter.evaluate(expr, env);
      assert.equal(env.foo, undefined);
    });

    it('evaluates values', function () {
      var expr = ['define', 'foo', 'bar'];
      var env = {bar: 'baz'};
      var newEnv = interpreter.evaluate(expr, env)[1];
      assert.equal(newEnv.foo, 'baz');
    });
  });

  describe('if', function () {
    it('returns first form if condition evaluates to true', function () {
      var expr = ['if', true, 'foo', 'bar'];
      assert.equal(interpreter.getResult(expr, {}), 'foo');
    });

    it('returns second form if condition evaluates to false', function () {
      var expr = ['if', false, 'foo', 'bar'];
      assert.equal(interpreter.getResult(expr, {}), 'bar');
    });

    it('evaluates first form if condition evaluates to true', function () {
      var expr = ['if', true, 'then', 'otherwise'];
      var env = {then: 'foo'};
      assert.equal(interpreter.getResult(expr, env), 'foo');
    });

    it('evaluates first form if condition evaluates to true', function () {
      var expr = ['if', false, 'then', 'otherwise'];
      var env = {otherwise: 'bar'};
      assert.equal(interpreter.getResult(expr, env), 'bar');
    });

    it('evaluates condition before branching', function () {
      var expr = ['if', 'cond', 'foo', 'bar'];
      var env = {cond: true};
      assert.equal(interpreter.getResult(expr, env), 'foo');
    });
  });

  describe('quote', function () {
    it('returns passed value without evaluation', function () {
      var env = {foo: constantly('bar')};
      var expr = ['quote', ['foo']];
      assert.deepEqual(interpreter.getResult(expr, env), ['foo']);
    });
  });

  describe('lambdas', function () {
    it('defines simple function without arguments', function () {
      var expr = ['define', 'foo', ['lambda', [], 'bar']];
      var result = interpreter.evaluate(expr, {});
      assert.equal(interpreter.getResult(['foo'], result[1]), 'bar');
    });

    it('binds arguments to call values', function () {
      var prog = [
        ['define', 'foo', ['lambda', ['arg'], 'arg']],
        ['foo', 'bar']
      ];
      assert.equal(interpreter.run(prog, core.env), 'bar');
    });

    it('supports lexical scope', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', [], 'foo']],
        ['bar']
      ];
      assert.equal(interpreter.run(prog, core.env), 'bar');
    });

    it('keeps call site scope', function () {
      var prog = [
        ['define', 'foo',
          ['lambda', ['a'],
            ['lambda', ['b'],
              ['+', 'a', 'b']]]],

        [['foo', 1], 2]
      ];
      assert.equal(interpreter.run(prog, core.env), 3);
    });

    it('gives local scope higher priority', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', ['foo'], 'foo']],
        ['bar', 'baz']
      ];
      assert.equal(interpreter.run(prog, core.env), 'baz');
    });

    it('throws when trying to invoke a symbol which is not bound to a function', function () {
      function block() {
        var prog = [
          ['define', 'foo', 'bar'],
          ['foo']
        ];
        interpreter.run(prog, core.env);
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
      assert.equal(interpreter.run(prog, core.env), 3);
    });

    it('defines the let bindings macro in core environment', function () {
      var prog = [
        ['let', ['a', 1, 'b', 2],
          ['+', 'a', 'b']]
      ];
      assert.equal(interpreter.run(prog, core.env), 3);
    });
  });

  describe('programs tests', function () {
    it('calculates fibonacci recursively', function () {
      var fib =
        ['define', 'fib',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['+',
                ['fib', ['-', 'n', 1]],
                ['fib', ['-', 'n', 2]]]]]];

      var fibEnv = interpreter.evaluate(fib, core.env)[1];

      var tests = [
        {input: 0, output: 1},
        {input: 1, output: 1},
        {input: 2, output: 2},
        {input: 3, output: 3},
        {input: 4, output: 5},
        {input: 5, output: 8}
      ];
      tests.forEach(function (test) {
        assert.equal(interpreter.getResult(['fib', test.input], fibEnv), test.output);
      });
    });

    it('calculates factorial recursively', function () {
      var fact =
        ['define', 'fact',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['*', 'n', ['fact', ['-', 'n', 1]]]]]];

      var factEnv = interpreter.evaluate(fact, core.env)[1];

      var tests = [
        {input: 0, output: 1},
        {input: 1, output: 1},
        {input: 2, output: 2},
        {input: 3, output: 6},
        {input: 4, output: 24},
        {input: 5, output: 120}
      ];
      tests.forEach(function (test) {
        assert.equal(interpreter.getResult(['fact', test.input], factEnv), test.output);
      });
    });

    it('supports higher order functions (map)', function () {
      var prog = [
        // Define map function
        ['define', 'map',
          ['lambda', ['f', 'coll'],
            ['if', ['empty', 'coll'],
              'coll',
              ['cons',
                ['f', ['car', 'coll']],
                ['map', 'f', ['cdr', 'coll']]]]]],

        // Define some collection
        ['define', 'coll', ['list', 1, 2, 3]],

        // Map collection with 'inc'
        ['map', 'inc', 'coll']
      ];

      assert.deepEqual(interpreter.run(prog, core.env), [2, 3, 4]);
    });
  });

});