var React = require('react');
var lisp = require('./lisp');

var enterKeyCode = 13;
var clearKeyCode = 76; // The letter L

var ResultItem = React.createClass({
  render: function () {
    var result = this.props.result;
    return (
      <li className="result-item">
        <pre className="result-expr">{result.expr}</pre>
        <pre>{JSON.stringify(result.value)}</pre>
      </li>
    );
  }
});

var InputBox = React.createClass({
  getInitialState: function () {
    return {expr: '["+", 1, 2]'}
  },
  render: function () {
    return (
      <div className="pure-form">
        <textarea className="pure-input-1" rows="5" cols="80" value={this.state.expr} onChange={this.onExprChange} onKeyDown={this.onKeyDown} />
        <p>
          <small className="notes">Ctrl+Enter to evaluate, Ctrl+L to clear</small>
          <button className="pure-button" onClick={this.onEvalClick}>Evaluate expression</button>{' '}
          <button className="pure-button" onClick={this.onClearClick}>Clear results</button>
        </p>
      </div>
    );
  },
  onExprChange: function (e) {
    this.setState({expr: e.target.value});
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
      results: [],
      error: null
    };
  },
  render: function () {
    return (
      <div>
        <ul>
          {this.getResults()}
          <li><InputBox onEvaluate={this.onEvaluate} onClear={this.onClear} onError={this.onError} /></li>
        </ul>
        <ErrorView error={this.state.error} />
      </div>
    );
  },
  getResults: function () {
    return this.state.results.map(function (result, index) {
      return <ResultItem key={index} result={result} />;
    });
  },
  onEvaluate: function (expr, parsed) {
    try {
      var evaluated = lisp.evaluate(parsed, this.state.env);
      var newResult = {expr: expr, value: evaluated[0]};
      this.setState({
        results: this.state.results.concat([newResult]),
        env: evaluated[1],
        error: null
      });
    } catch (e) {
      this.onError(e);
    }
  },
  onClear: function () {
    this.setState({results: [], error: null});
  },
  onError: function (error) {
    this.setState({error: error});
  }
});

React.render(
  React.createElement(Repl, null),
  document.getElementById('repl')
);
