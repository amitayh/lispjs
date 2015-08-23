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

    it('should invoke anonymous functions', function () {
      var expr = [['lambda', ['a', 'b'], ['+', 'a', 'b']], 1, 2];
      assert.equal(lisp.getResult(expr, lisp.defaultEnv), 3);
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
      assert.equal(lisp.run(prog), 'bar');
    });

    it('should support lexical scope', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', [], 'foo']],
        ['bar']
      ];
      assert.equal(lisp.run(prog), 'bar');
    });

    it('should give local scope higher priority', function () {
      var prog = [
        ['define', 'foo', 'bar'],
        ['define', 'bar', ['lambda', ['foo'], 'foo']],
        ['bar', 'baz']
      ];
      assert.equal(lisp.run(prog), 'baz');
    });

    it('should throw when trying to invoke a symbol which is not bound to a function', function () {
      function block() {
        var prog = [
          ['define', 'foo', 'bar'],
          ['foo']
        ];
        lisp.run(prog);
      }
      assert.throws(block, /'foo' is not a function/);
    });
  });

  describe('macros', function () {
    it('should be able to define simple macros', function () {
      var prog = [
        ['define', 'nth',
          ['lambda', ['coll', 'index'],
            ['if', ['=', 'index', 0],
              ['car', 'coll'],
              ['nth', ['cdr', 'coll'], ['-', 'index', 1]]]]],

        ['defmacro', 'infix', ['expr'],
          ['list',
            ['nth', 'expr', 1],
            ['nth', 'expr', 0],
            ['nth', 'expr', 2]]],

        ['infix', [1, '+', 2]]
      ];
      assert.equal(lisp.run(prog), 3);
    });

    it('should be able to create a defun macro (define + lambda shortcut)', function () {
      var prog = [
        ['defmacro', 'defun', ['name', 'args', 'body'],
          ['list',
            ['quote', 'define'],
            'name',
            ['list',
              ['quote', 'lambda'],
              'args',
              'body']]],

        ['defun', 'inc', ['n'], ['+', 'n', 1]],

        ['inc', 1]
      ];
      assert.equal(lisp.run(prog), 2);
    });
  });

  describe('programs tests', function () {
    it('should calculate fibonacci recursively', function () {
      var fib =
        ['define', 'fib',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['+',
                ['fib', ['-', 'n', 1]],
                ['fib', ['-', 'n', 2]]]]]];

      var fibEnv = lisp.evaluate(fib, lisp.defaultEnv)[1];

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
      var fact =
        ['define', 'fact',
          ['lambda', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['*', 'n', ['fact', ['-', 'n', 1]]]]]];

      var factEnv = lisp.evaluate(fact, lisp.defaultEnv)[1];

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
        ['define', 'coll', ['list', 1, 2, 3]],

        // Map collection with 'inc'
        ['map', 'inc', 'coll']
      ];

      assert.deepEqual(lisp.run(prog), [2, 3, 4]);
    });

    it('should search for element in collection', function () {
      var contains =
        ['define', 'contains',
          ['lambda', ['el', 'coll'],
            ['if', ['empty', 'coll'],
              false,
              ['or',
                ['=', 'el', ['car', 'coll']],
                ['contains', 'el', ['cdr', 'coll']]]]]];

      var containsEnv = lisp.evaluate(contains, lisp.defaultEnv)[1];

      assert.equal(lisp.getResult(['contains', 0, ['list', 1, 2, 3]], containsEnv), false);
      assert.equal(lisp.getResult(['contains', 2, ['list', 1, 2, 3]], containsEnv), true);
    });
  });

});