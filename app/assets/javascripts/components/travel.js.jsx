class TravelContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
    this.loadTravelsFromServer = this.loadTravelsFromServer.bind(this);
  }

  loadTravelsFromServer() {
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

  componentDidMount() {
    this.loadTravelsFromServer();
  }

  render() {
    return (
      <div className="row upcoming-travel-container">
        <div className="col-xs-12">
          <p className="travel-header">
            <i className="glyphicon glyphicon-plane"/>
            Travel Schedule
          </p>
        </div>
        <TravelList data={this.state.data} />
      </div>
    );
  }
};

class TravelList extends React.Component {
  render() {
    var startingIndex = this.props.data.length > 6 ? this.props.data.length - 6 : 0;
    var travelNodes = this.props.data.sort(function(a, b) {
      return Date.parse(a.wireDate) - Date.parse(b.wireDate);
    }).slice(startingIndex).map(function(travel) {
      return (
        <Travel
          date={travel.date}
          datePassed={travel.datePassed}
          location={travel.location}
          title={travel.title}
          link={travel.link} />
      );
    });
    return (
      <div className="travel-list">
        {travelNodes}
      </div>
    );
  }
};

class Travel extends React.createClass {
  render() {
    var topLevelClassName = this.props.datePassed ?
      "upcoming-travel upcoming-travel-done col-xs-2" :
      "upcoming-travel col-xs-2";

    return (
      <div className={topLevelClassName}>
        <div className="upcoming-travel-date">
          {this.props.date}
        </div>
        <div className="upcoming-travel-location">
          {this.props.location}
        </div>
        <div className="upcoming-travel-venue">
          <a href={this.props.link} target="_blank" className="upcoming-travel-link">
            {this.props.title}
          </a>
        </div>
      </div>
    );
  }
};

class TravelForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.travel;
    this._handleSubmit = this._handleSubmit.bind(this);
  }

  _handleSubmit(e) {
    e.preventDefault();
    var travel = {
      travel: {
        date: this.refs.date.getValue(),
        title: this.refs.title.getValue(),
        location: this.refs.location.getValue(),
        link: this.refs.link.getValue()
      }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: this.props.action,
      data: travel,
      success: function(data) {
        window.location.href = "/"
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    return false;
  }

  render() {
    return (
      <form className="update-form form-horizontal" onSubmit={this._handleSubmit}>
        <InputField name="Date" type="date" value={this.state.wireDate} ref="date" />
        <InputField name="Title" type="text" value={this.state.title} ref="title" />
        <InputField name="Location" type="text" value={this.state.location} ref="location" />
        <InputField name="Link" type="text" value={this.state.link} ref="link" />
        <SubmitButton/>
      </form>
    );
  }
};