var UpdateContainer = React.createClass({
  loadUpdatesFromServer: function() {
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
  },

  getInitialState: function() {
    return {data: []};
  },

  componentDidMount: function() {
    this.loadUpdatesFromServer();
  },

  render: function() {
    return (
      <div className="update-container">
        <p className="update-header">News & Updates</p>
        <div className="update-list-container">
          <UpdateList data={this.state.data} assets={this.props.assets} />
        </div>
      </div>
    );
  }
});

var UpdateList = React.createClass({
  render: function() {
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
});

var Update = React.createClass({
  createMarkup: function() {
    return { __html: this.props.text }
  },

  render: function() {
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
});

var UpdateForm = React.createClass({
  _handleSubmit: function(e) {
    e.preventDefault();
    var update = {
      update: {
        date: this.refs.date.getValue(),
        text: this.refs.text.getValue(),
        backing_type: this.refs.type.getValue()
      }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: this.props.action,
      data: update,
      success: function(data) {
        window.location.href = "/"
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    return false;
  },

  getInitialState: function() {
    return this.props.update;
  },

  render: function() {
    return (
      <form className="paper-form" onSubmit={this._handleSubmit} className="form-horizontal">
        <InputField name="Date" type="date" value={this.state.wireDate} ref="date" />
        <InputField name="Text" type="text" value={this.state.text} ref="text" />
        <SelectField name="Type" options={this.props.updateTypes} value={this.state.backing_type} ref="type" />
        <SubmitButton/>
      </form>
    );
  }
});