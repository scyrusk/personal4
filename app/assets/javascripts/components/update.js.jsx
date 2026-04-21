class UpdateContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      scrollable: false,
      clickCount: 0
    };
    this._handleClick = this._handleClick.bind(this);
    this.loadUpdatesFromServer = this.loadUpdatesFromServer.bind(this);
  }

  loadUpdatesFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  }

  _handleClick() {
    if (!this.state.scrollable && this.state.clickCount === 0) {
      gaSendEvent("Interaction", "ToggleScroll", "UpdateContainer");
    }

    this.setState({
      scrollable: !this.state.scrollable,
      clickCount: this.state.clickCount + 1
    });
  }

  componentDidMount() {
    this.loadUpdatesFromServer();
  }

  render() {
    var containerClass = this.state.scrollable ?
      "update-list-container scrollable" :
      "update-list-container not-scrollable";
    return (
      <div className="update-container" onClick={this._handleClick}>
        <p className="update-header">
          News & Updates
          <span className="header-help"> (click to toggle scroll)</span>
        </p>
        <div className={containerClass}>
          <UpdateList data={this.state.data} assets={this.props.assets} />
        </div>
      </div>
    );
  }
};

class UpdateList extends React.Component  {
  render() {
    var assets = this.props.assets;
    var updateNodes = this.props.data.sort(function(a, b) {
      return Date.parse(b.date) - Date.parse(a.date);
    }).map(function(update) {
      return (
        <Update
          type={update.type}
          date={update.date}
          text={update.text}
          key={update.id}
          pic={assets[update.type]} />
      );
    });
    return (
      <div className="update-list">
        {updateNodes}
      </div>
    );
  }
};

class Update extends React.Component  {
  createMarkup() {
    return { __html: this.props.text }
  }

  render() {
    return (
      <div className="update row well well-sm">
        <div className="update-icon col-xs-2">
          <img src={this.props.pic} className="update-icon-img" />
        </div>
        <div className="update-date col-xs-2">
          {this.props.date}
        </div>
        <div className="update-body col-xs-offset-1 col-xs-7" dangerouslySetInnerHTML={this.createMarkup()} />
      </div>
    );
  }
};

class UpdateForm extends React.Component {
  constructor(props) {
    super(props);
    var u = props.update || {};
    this.state = {
      date:         u.wireDate || '',
      text:         u.text || '',
      backing_type: u.backing_type != null ? u.backing_type : ''
    };
    this._handleSubmit = this._handleSubmit.bind(this);
    this._set = this._set.bind(this);
  }

  _set(field) {
    var self = this;
    return function(value) { var u = {}; u[field] = value; self.setState(u); };
  }

  _handleSubmit(e) {
    e.preventDefault();
    var s = this.state;
    var update = {
      update: {
        date:         s.date,
        text:         s.text,
        backing_type: s.backing_type
      }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: this.props.action,
      data: update,
      success: function(data) { window.location.href = "/"; }.bind(this),
      error: function(xhr, status, err) { console.error(this.props.url, status, err.toString()); }.bind(this)
    });

    return false;
  }

  render() {
    var s = this.state;
    return (
      <form className="paper-form form-horizontal" onSubmit={this._handleSubmit}>
        <InputField name="Date" type="date" value={s.date}         onChange={this._set('date')} />
        <InputField name="Text" type="text" value={s.text}         onChange={this._set('text')} />
        <SelectField name="Type" options={this.props.updateTypes}  value={s.backing_type} onChange={this._set('backing_type')} />
        <SubmitButton/>
      </form>
    );
  }
};