var Author = React.createClass({
  render: function() {
    var dClassNames = "author " + (this.props.self ? 'author-self' : 'author-other')
    return (
      <div className={dClassNames}>
        <span className="author-name">{this.props.name}</span>
      </div>
    );
  }
});