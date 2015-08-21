var assert = require('assert');
var lisp = require('../src/lisp');

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
    it('should evaluate simple values as themselves', function () {
      var exprs = [1, 'foo', true, {foo: 'bar'}];
      exprs.forEach(function (expr) {
        assert.strictEqual(lisp.getResult(expr, {}), expr);
      });
    });

    it('should evaluate bound symbols to their values', function () {
      var expr = 'foo';
      var env = {foo: 'bar'};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });
  });

  describe('function invocation', function () {
    it('should invoke a function without arguments', function () {
      var expr = ['foo'];
      var env = {foo: constantly('bar')};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });

    it('should invoke a function with arguments', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });

    it('should evaluate function arguments before invoking a function', function () {
      var expr = ['foo', 'bar'];
      var env = {foo: identity, bar: 'baz'};
      assert.equal(lisp.getResult(expr, env), 'baz');
    });
  });

  describe('define', function () {
    it('should bind values in environment when calling define', function () {
      var expr = ['define', 'foo', 'bar'];
      assert.deepEqual(lisp.evaluate(expr, {}), [null, {foo: 'bar'}]);
    });

    it('should not mutate the original environment', function () {
      var env = {};
      var expr = ['define', 'foo', 'bar'];
      lisp.evaluate(expr, env);
      assert.equal(env.foo, undefined);
    });

    it('should evaluate values when calling define', function () {
      var expr = ['define', 'foo', 'bar'];
      var env = {bar: 'baz'};
      var newEnv = lisp.evaluate(expr, env)[1];
      assert.equal(newEnv.foo, 'baz');
    });
  });

  describe('if', function () {
    it('should return first form if condition evaluates to true', function () {
      var expr = ['if', true, 'foo', 'bar'];
      assert.equal(lisp.getResult(expr, {}), 'foo');
    });

    it('should return second form if condition evaluates to false', function () {
      var expr = ['if', false, 'foo', 'bar'];
      assert.equal(lisp.getResult(expr, {}), 'bar');
    });

    it('should evaluate first form if condition evaluates to true', function () {
      var expr = ['if', true, 'then', 'otherwise'];
      var env = {then: 'foo'};
      assert.equal(lisp.getResult(expr, env), 'foo');
    });

    it('should evaluate first form if condition evaluates to true', function () {
      var expr = ['if', false, 'then', 'otherwise'];
      var env = {otherwise: 'bar'};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });

    it('should evaluate condition before branching', function () {
      var expr = ['if', 'cond', 'foo', 'bar'];
      var env = {cond: true};
      assert.equal(lisp.getResult(expr, env), 'foo');
    });
  });

  describe('quote', function () {
    it('should return passed value without evaluation', function () {
      var env = {foo: constantly('bar')};
      var expr = ['quote', ['foo']];
      assert.deepEqual(lisp.getResult(expr, env), ['foo']);
    });
  });

  describe('lambdas', function () {
    it('should define simple function without arguments', function () {
      var expr = ['define', 'foo', ['lambda', [], 'bar']];
      var result = lisp.evaluate(expr, {});
      assert.equal(lisp.getResult(['foo'], result[1]), 'bar');
    });

    it('should bind arguments when calling a function', function () {
      var prog = [
        ['define', 'foo', ['lambda', ['arg'], 'arg']],
        ['foo', 'bar']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'bar');
    });

    it('should support lexical scope', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', [], 'foo']],
        ['bar']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'bar');
    });

    it('should give local scope higher priority', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', ['foo'], 'foo']],
        ['bar', 'baz']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'baz');
    });
  });

  describe('programs tests', function () {
    it('should calculate fibonacci recursively', function () {
      var prog =
        ['define', 'fib',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['+',
                ['fib', ['-', 'n', 1]],
                ['fib', ['-', 'n', 2]]]]]];

      var fibEnv = lisp.evaluate(prog, lisp.defaultEnv)[1];

      var tests = [
        {input: 0, output: 1},
        {input: 1, output: 1},
        {input: 2, output: 2},
        {input: 3, output: 3},
        {input: 4, output: 5},
        {input: 5, output: 8}
      ];
      tests.forEach(function (test) {
        assert.equal(lisp.getResult(['fib', test.input], fibEnv), test.output);
      });
    });

    it('should calculate factorial recursively', function () {
      var prog =
        ['define', 'fact',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['*', 'n', ['fact', ['-', 'n', 1]]]]]];

      var factEnv = lisp.evaluate(prog, lisp.defaultEnv)[1];

      var tests = [
        {input: 0, output: 1},
        {input: 1, output: 1},
        {input: 2, output: 2},
        {input: 3, output: 6},
        {input: 4, output: 24},
        {input: 5, output: 120}
      ];
      tests.forEach(function (test) {
        assert.equal(lisp.getResult(['fact', test.input], factEnv), test.output);
      });
    });

    it('should support higher order functions (map)', function () {
      var prog = [
        // Define map function
        ['define', 'map',
          ['lambda', ['f', 'coll'],
            ['if', ['empty', 'coll'],
              'coll',
              ['cons',
                ['f', ['car', 'coll']],
                ['map', 'f', ['cdr', 'coll']]]]]],

        // Define unary increment function
        ['define', 'inc',
          ['lambda', ['num'],
            ['+', 'num', 1]]],

        // Define some collection
        ['define', 'coll', ['quote', [1, 2, 3]]],

        // Map collection with 'inc'
        ['map', 'inc', 'coll']
      ];

      assert.deepEqual(lisp.getResultMulti(prog, lisp.defaultEnv), [2, 3, 4]);
    });
  });

});