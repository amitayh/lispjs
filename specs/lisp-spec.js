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

  it('should evaluate multiple blocks of code', function () {
    var prog = [
      ['define', 'foo', 'bar'],
      'foo'
    ];
    assert.equal(lisp.getResultMulti(prog, {}), 'bar');
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

    it('should allow recursion', function () {
      var env = {
        '<': function (a, b) { return a < b; },
        '+': function (a, b) { return a + b; },
        '-': function (a, b) { return a - b; }
      };
      var prog =
        ['define', 'fib',
          ['func', ['n'],
            ['if', ['<', 'n', 2],
              1,
              ['+',
                ['fib', ['-', 'n', 1]],
                ['fib', ['-', 'n', 2]]]]]];

      var fibEnv = lisp.evaluate(prog, env)[1];

      assert.equal(lisp.getResult(['fib', 0], fibEnv), 1);
      assert.equal(lisp.getResult(['fib', 1], fibEnv), 1);
      assert.equal(lisp.getResult(['fib', 2], fibEnv), 2);
      assert.equal(lisp.getResult(['fib', 3], fibEnv), 3);
      assert.equal(lisp.getResult(['fib', 4], fibEnv), 5);
      assert.equal(lisp.getResult(['fib', 5], fibEnv), 8);
    });
  });

});