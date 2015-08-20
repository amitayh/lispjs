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
      var expr1 = 1, expr2 = 'foo';
      var env = {};
      assert.deepEqual(lisp.evaluate(expr1, env), [expr1, env]);
      assert.deepEqual(lisp.evaluate(expr2, env), [expr2, env]);
    });

    it('should evaluate bound symbols to their values', function () {
      var expr = 'foo';
      var env = {foo: 'bar'};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });
  });

  describe('function invocation', function () {
    it('should invoke function without arguments', function () {
      var expr = ['foo'];
      var env = {foo: constantly('bar')};
      assert.equal(lisp.getResult(expr, env), 'bar');
    });

    it('should invoke function with arguments', function () {
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

    it('should keep the original environment unchanged', function () {
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
    it('should allow simple branching', function () {
      var env = {};
      assert.equal(lisp.getResult(['if', true, 'foo', 'bar'], env), 'foo');
      assert.equal(lisp.getResult(['if', false, 'foo', 'bar'], env), 'bar');
    });

    it('should evaluate condition before branching', function () {
      assert.equal(lisp.getResult(['if', 'cond', 'foo', 'bar'], {cond: true}), 'foo');
      assert.equal(lisp.getResult(['if', 'cond', 'foo', 'bar'], {cond: false}), 'bar');
    });

    it('should evaluate branches', function () {
      var env = {then: 'foo', otherwise: 'bar'};
      assert.equal(lisp.getResult(['if', true, 'then', 'otherwise'], env), 'foo');
      assert.equal(lisp.getResult(['if', false, 'then', 'otherwise'], env), 'bar');
    });
  });

  describe('quote', function () {
    it('should return passed value without evaluation', function () {
      var env = {foo: constantly('bar')};
      var expr = ['quote', ['foo']];
      assert.deepEqual(lisp.getResult(expr, env), ['foo']);
    });
  });

  describe('closures', function () {
    it('should define simple function without arguments', function () {
      var expr = ['define', 'foo', ['func', [], 'bar']];
      var result = lisp.evaluate(expr, {});
      assert.equal(lisp.getResult(['foo'], result[1]), 'bar');
    });

    it('should bind arguments when calling a function', function () {
      var prog = [
        ['define', 'foo', ['func', ['arg'], 'arg']],
        ['foo', 'bar']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'bar');
    });

    it('should support lexical scope', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['func', [], 'foo']],
        ['bar']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'bar');
    });

    it('should give local scope higher priority', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['func', ['foo'], 'foo']],
        ['bar', 'baz']
      ];
      assert.equal(lisp.getResultMulti(prog, {}), 'baz');
    });
  });

  describe('programs tests', function () {
    it('should be able to calculate fibonacci recursively', function () {
      var prog =
        ['define', 'fib',
          ['func', ['n'],
            ['if', ['<', 'n', 2],
              // n < 2, return 1
              1,
              // return fib(n-1) + fib(n-2)
              ['+',
                ['fib', ['-', 'n', 1]],
                ['fib', ['-', 'n', 2]]]]]];

      var fibEnv = lisp.evaluate(prog, lisp.defaultEnv)[1];

      assert.equal(lisp.getResult(['fib', 0], fibEnv), 1);
      assert.equal(lisp.getResult(['fib', 1], fibEnv), 1);
      assert.equal(lisp.getResult(['fib', 2], fibEnv), 2);
      assert.equal(lisp.getResult(['fib', 3], fibEnv), 3);
      assert.equal(lisp.getResult(['fib', 4], fibEnv), 5);
      assert.equal(lisp.getResult(['fib', 5], fibEnv), 8);
    });

    it('should be able to define map function with default env', function () {
      var prog = [
        // Define map function
        ['define', 'map',
          ['func', ['f', 'coll'],
            ['if', ['empty', 'coll'],
              'coll',
              ['cons',
                ['f', ['car', 'coll']],
                ['map', 'f', ['cdr', 'coll']]]]]],

        // Define unary increment function
        ['define', 'inc',
          ['func', ['num'],
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