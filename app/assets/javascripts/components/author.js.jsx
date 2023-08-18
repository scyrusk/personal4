class Author extends React.Component {
  render() {
    var dClassNames = "author " + (this.props.self ? 'author-self' : 'author-other')
    return (
      <div className={dClassNames} onClick={this.props.handleAuthorClick}>
        <span className="author-name">{this.props.name}</span>
      </div>
    );
  }
};