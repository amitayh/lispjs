var React = require('react');
var interpreter = require('./interpreter');
var env = require('./env').getDefaultEnv();

var enterKeyCode = 13;
var clearKeyCode = 76; // The letter L

function Result(expr) {
  this.expr = expr;
  this.value = null;
  this.error = null;
  this.evaluate();
}
Result.prototype.evaluate = function () {
  try {
    var parsed = JSON.parse(this.expr);
    this.value = interpreter.evaluate(parsed, env);
  } catch (e) {
    this.error = e;
  }
};
Result.prototype.hasError = function () {
  return (this.error !== null);
};
Result.prototype.getValue = function () {
  var error = this.error;
  return error ? error.toString() : JSON.stringify(this.value);
};

var Code = React.createClass({
  render: function () {
    return (
      <pre ref="block">
        <code className={this.props.lang}>{this.props.children}</code>
      </pre>
    );
  },
  componentDidMount: function () {
    var block = React.findDOMNode(this.refs.block);
    hljs.highlightBlock(block);
  }
});

var ResultItem = React.createClass({
  render: function () {
    return (
      <li className="result-item">
        <Code lang="javascript">{this.props.result.expr}</Code>
        {this.getResult()}
      </li>
    );
  },
  getResult: function () {
    var result = this.props.result;
    var value = result.getValue();
    return result.hasError() ?
      <pre className="alert-danger">{value}</pre> :
      <Code lang="javascript">{value}</Code>;
  }
});

var InputBox = React.createClass({
  getInitialState: function () {
    return {
      expr: '["+", 1, 2]',
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
    var expr = e.target.value, exprInvalid = false;
    try {
      JSON.parse(expr);
    } catch (e) {
      exprInvalid = true;
    }
    this.setState({expr: expr, exprInvalid: exprInvalid});
  },
  onKeyDown: function (e) {
    var keyCode = e.keyCode;
    if (e.ctrlKey && (keyCode == enterKeyCode || keyCode == clearKeyCode)) {
      e.preventDefault();
      if (keyCode == enterKeyCode) {
        this.onEvalClick();
      }
      if (keyCode == clearKeyCode) {
        this.onClearClick();
      }
    }
  },
  onEvalClick: function () {
    if (this.getEvalDisabled()) {
      return;
    }
    var expr = this.state.expr.trim();
    this.props.onEvaluate(expr);
    this.setState({expr: ''});
  },
  onClearClick: function () {
    this.props.onClear();
  }
});

var Repl = React.createClass({
  getInitialState: function () {
    return {results: []};
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
  onEvaluate: function (expr) {
    var results = this.state.results.concat([new Result(expr)]);
    this.setState({results: results});
  },
  onClear: function () {
    this.setState({results: []});
  }
});

React.render(
  React.createElement(Repl, null),
  document.getElementById('repl')
);
