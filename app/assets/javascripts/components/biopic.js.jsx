var BioPic = React.createClass({
  _handleMouseOver: function(e) {
    e.preventDefault();
    this.setState({
      // upsideDown: true
    });
  },

  _handleMouseOut: function(e) {
    e.preventDefault();
    this.setState({
      upsideDown: false
    });
  },

  getInitialState: function() {
    return {
      upsideDown: false
    };
  },

  render: function() {
    var picSrc = this.state.upsideDown ?
      this.props.upsideDown :
      this.props.rightSideUp;

    return (
      <div
        className="personal-image-container"
        onMouseUp={this._handleMouseOut}
        onMouseDown={this._handleMouseOver} >
        <img src={picSrc} className="personal-image"/>
      </div>
    );
  }
});