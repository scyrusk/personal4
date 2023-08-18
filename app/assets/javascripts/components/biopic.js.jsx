class BioPic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      upsideDown: false
    };
    this._handleMouseOver = this._handleMouseOver.bind(this);
    this._handleMouseOut = this._handleMouseOut.bind(this);
  }

  _handleMouseOver(e) {
    e.preventDefault();
    this.setState({
      // upsideDown: true
    });
  }

  _handleMouseOut(e) {
    e.preventDefault();
    this.setState({
      upsideDown: false
    });
  }

  getInitialState() {
    return {
      upsideDown: false
    };
  }

  render() {
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
};