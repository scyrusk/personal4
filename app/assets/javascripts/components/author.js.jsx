class Author extends React.Component {
  render() {
    var name = this.props.name;
    var dClassNames = "author " + (this.props.self ? 'author-self' : 'author-other');
    return (
      <span
        className={dClassNames}
        onClick={this.props.handleAuthorClick}
        onMouseEnter={function() { window.dispatchEvent(new CustomEvent('searchPreview', { detail: { text: name } })); }}
        onMouseLeave={function() { window.dispatchEvent(new CustomEvent('searchPreview', { detail: { text: null } })); }}
      >
        <span className="author-name">{name}</span>
      </span>
    );
  }
};