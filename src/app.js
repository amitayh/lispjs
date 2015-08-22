var React = require('react');
var lisp = require('./lisp');

var enterKeyCode = 13;
var clearKeyCode = 76; // The letter L

var ResultItem = React.createClass({
  render: function () {
    return (
      <li className="result-item">
        <pre className="result-expr">{this.props.result.expr}</pre>
        <pre className={this.getResultClass()}>{this.getResultValue()}</pre>
      </li>
    );
  },
  getResultClass: function () {
    return this.props.result.error ? 'alert-danger' : '';
  },
  getResultValue: function () {
    var result = this.props.result, error = result.error;
    return error ? error.toString() : JSON.stringify(result.value);
  }
});

var InputBox = React.createClass({
  defaultExpr: '["+", 1, 2]',
  getInitialState: function () {
    return {
      expr: this.defaultExpr,
      parsed: JSON.parse(this.defaultExpr),
      exprInvalid: false
    }
  },
  render: function () {
    return (
      <div>
        <div className={this.getTextAreaClass()}>
          <textarea className="form-control" rows="5" cols="80" value={this.state.expr} onChange={this.onExprChange} onKeyDown={this.onKeyDown} />
        </div>
        <div className="form-group">
          <small className="notes pull-right">Ctrl+Enter to evaluate, Ctrl+L to clear</small>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={this.onEvalClick} disabled={this.getEvalDisabled()}>
              <span className="glyphicon glyphicon-play" aria-hidden="true"></span>{' '}
              Evaluate expression
            </button>{' '}
            <button className="btn btn-default" onClick={this.onClearClick} disabled={this.props.disableClear}>
              <span className="glyphicon glyphicon-ban-circle" aria-hidden="true"></span>{' '}
              Clear results
            </button>
          </div>
        </div>
      </div>
    );
  },
  getTextAreaClass: function () {
    var classes = ['form-group'];
    if (this.state.exprInvalid) {
      classes.push('has-error');
    }
    return classes.join(' ');
  },
  getEvalDisabled: function () {
    var state = this.state;
    return (state.exprInvalid || state.expr === '');
  },
  onExprChange: function (e) {
    var expr = e.target.value, exprInvalid = false, parsed;
    if (expr !== '') {
      try {
        parsed = JSON.parse(expr);
      } catch (e) {
        exprInvalid = true;
      }
    }
    this.setState({expr: expr, parsed: parsed, exprInvalid: exprInvalid});
  },
  onKeyDown: function (e) {
    if (e.ctrlKey && (e.keyCode == enterKeyCode || e.keyCode == clearKeyCode)) {
      e.preventDefault();
      if (e.keyCode == enterKeyCode) {
        this.onEvalClick();
      }
      if (e.keyCode == clearKeyCode) {
        this.onClearClick();
      }
    }
  },
  onEvalClick: function () {
    var expr = this.state.expr.trim();
    if (expr !== '') {
      try {
        var parsed = JSON.parse(expr);
        this.props.onEvaluate(expr, parsed);
        this.setState({expr: ''});
      } catch (e) {
        this.props.onError(e);
      }
    }
  },
  onClearClick: function () {
    this.props.onClear();
  }
});

var ErrorView = React.createClass({
  render: function () {
    var error = this.props.error;
    var errorMessage = (error !== null) ? error.toString() : '';
    return <p className="error" style={this.getStyle()}>{errorMessage}</p>;
  },
  getStyle: function () {
    return {display: (this.props.error === null) ? 'none' : 'block'};
  }
});

var Repl = React.createClass({
  getInitialState: function () {
    return {
      env: lisp.defaultEnv,
      results: []
    };
  },
  render: function () {
    return (
      <div>
        <ul className="list-unstyled">
          {this.getResults()}
          <li><InputBox onEvaluate={this.onEvaluate} onClear={this.onClear} disableClear={this.getDisableClear()} /></li>
        </ul>
      </div>
    );
  },
  getResults: function () {
    return this.state.results.map(function (result, index) {
      return <ResultItem key={index} result={result} />;
    });
  },
  getDisableClear: function () {
    return (this.state.results.length === 0);
  },
  onEvaluate: function (expr, parsed) {
    var env = this.state.env, value, error;
    try {
      var evaluated = lisp.evaluate(parsed, this.state.env);
      value = evaluated[0];
      env = evaluated[1];
    } catch (e) {
      error = e;
    }
    var newResult = {expr: expr, value: value, error: error};
    var results = this.state.results.concat([newResult]);
    this.setState({results: results, env: env});
  },
  onClear: function () {
    this.setState({results: []});
  }
});

React.render(
  React.createElement(Repl, null),
  document.getElementById('repl')
);
