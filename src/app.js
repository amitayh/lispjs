var React = require('react');
var lisp = require('./lisp');

var enterKeyCode = 13;

var ResultItem = React.createClass({
  render: function () {
    var result = this.props.result;
    return (
      <li className="result-item">
        <pre className="result-expr">{result.expr}</pre>
        <pre className={this.getValueClass()}>{result.value}</pre>
      </li>
    );
  },
  getValueClass: function () {
    var classes = ['resultValue'];
    if (this.props.result.value === null) {
      classes.push('result-null');
    }
    return classes.join(' ');
  }
});

var InputBox = React.createClass({
  getInitialState: function () {
    return {expr: '["+", 1, 2]'}
  },
  render: function () {
    return (
      <div className="pure-form">
        <textarea className="pure-input-1" rows="5" cols="80" value={this.state.expr}
                  onChange={this.onExprChange} onKeyDown={this.onKeyDown} />
        <p>
          <button className="pure-button"
                  onClick={this.onEvalClick}>Evaluate</button>
        </p>
      </div>
    );
  },
  onExprChange: function (e) {
    var expr = e.target.value;
    if (expr.trim() !== '') {
      this.setState({expr: expr});
    }
  },
  onKeyDown: function (e) {
    if (e.ctrlKey && e.keyCode == enterKeyCode) {
      this.onEvalClick();
    }
  },
  onEvalClick: function () {
    var expr = this.state.expr.trim();
    if (expr !== '') {
      this.props.onEvaluate(expr);
    }
    this.setState({expr: ''});
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
          <li><InputBox onEvaluate={this.onEvaluate} /></li>
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
  onEvaluate: function (expr) {
    try {
      var parsed = JSON.parse(expr);
      var evaluated = lisp.evaluate(parsed, this.state.env);
      var newResult = {expr: expr, value: evaluated[0]};
      this.setState({
        results: this.state.results.concat([newResult]),
        env: evaluated[1],
        error: null
      });
    } catch (e) {
      this.setState({error: e});
    }
  }
});

React.render(
  React.createElement(Repl, null),
  document.getElementById('repl')
);
