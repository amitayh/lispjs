var expect = require('expect');
var lisp = require('../src/lisp');

describe('lispjs', function () {

  describe('evaluate()', function () {

    it('should evaluate simple values as themselves', function () {
      var expr1 = 1, expr2 = 'foo';
      var env = {};
      expect(lisp.evaluate(expr1, env)).toEqual([expr1, env]);
      expect(lisp.evaluate(expr2, env)).toEqual([expr2, env]);
    });

  });

});