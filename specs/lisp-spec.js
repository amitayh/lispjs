var expect = require('expect');
var lisp = require('../src/lisp');

describe('lispjs', function () {

  describe('evaluate()', function () {

    it('should evaluate simple values as themselves', function () {
      var expr = 1;
      var env = {};
      expect(lisp.evaluate(expr, env)).toEqual([expr, env]);
    });

  });

});