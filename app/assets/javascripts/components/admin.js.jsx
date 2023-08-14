class AdminContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      papers: [],
      updates: [],
      awards: [],
      travels: []
    };
    this._loadDataFromServer = this._loadDataFromServer.bind(this);
  }

  _loadDataFromServer(url, stateKey) {
    $.ajax({
      url: url,
      dataType: 'json',
      cache: false,
      success: function (data) {
        const map = {}; // Note the const declaration
        map[stateKey] = data.reverse();
        this.setState(map);
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  }

  componentDidMount() {
    this._loadDataFromServer(this.props.papersURL, "papers");
    this._loadDataFromServer(this.props.awardsURL, "awards");
    this._loadDataFromServer(this.props.updatesURL, "updates");
    this._loadDataFromServer(this.props.travelsURL, "travels");
  }

  render() {
    return (
      <div className="admin-container">
        <div className="admin-paper-container">
          <h1>Papers</h1>
          <PapersAdminList data={this.state.papers} />
        </div>
        <div className="admin-updates-container">
          <h1>Updates</h1>
          <UpdatesAdminList data={this.state.updates} />
        </div>
        <div className="admin-awards-container">
          <h1>Awards</h1>
          <AwardsAdminList data={this.state.awards} />
        </div>
        <div className="admin-travels-container">
          <h1>Travels</h1>
          <TravelsAdminList data={this.state.travels} />
        </div>
      </div>
    );
  }
}

class PapersAdminList extends React.Component {
  render() {
    var paperNodes = this.props.data.map(function(paper) {
      return (
        <tr>
          <td>{paper.id}</td>
          <td>{paper.title}</td>
          <td>
            <div className="btn-group" role="group" aria-label="...">
              <a href={"/papers/" + paper.id + "/edit"} className="btn btn-default">Edit</a>
              <a href={"/papers/" + paper.id} data-confirm="Are you sure?" data-method="delete" className="btn btn-danger">Destroy</a>
            </div>
          </td>
        </tr>
      );
    });

    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Administrate</th>
          </tr>
        </thead>
        <tbody>
          {paperNodes}
        </tbody>
      </table>
    );
  }
};

class UpdatesAdminList extends React.Component {
  render() {
    var updateNodes = this.props.data.map(function(update) {
      return (
        <tr>
          <td className="col-xs-1">{update.id}</td>
          <td className="col-xs-9" dangerouslySetInnerHTML={ {__html: update.text} } />
          <td className="col-xs-2">
            <div className="btn-group" role="group" aria-label="...">
              <a href={"/updates/" + update.id + "/edit"} className="btn btn-default">Edit</a>
              <a href={"/updates/" + update.id} data-confirm="Are you sure?" data-method="delete" className="btn btn-danger">Destroy</a>
            </div>
          </td>
        </tr>
      );
    });

    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Administrate</th>
          </tr>
        </thead>
        <tbody>
          {updateNodes}
        </tbody>
      </table>
    );
  }
};


class AwardsAdminList extends React.Component {
  render() {
    var awardNodes = this.props.data.map(function(award) {
      return (
        <tr>
          <td>{award.id}</td>
          <td>{award.body}</td>
          <td>
            <div className="btn-group" role="group" aria-label="...">
              <a href={"/awards/" + award.id + "/edit"} className="btn btn-default">Edit</a>
              <a href={"/awards/" + award.id} data-confirm="Are you sure?" data-method="delete" className="btn btn-danger">Destroy</a>
            </div>
          </td>
        </tr>
      );
    });

    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Administrate</th>
          </tr>
        </thead>
        <tbody>
          {awardNodes}
        </tbody>
      </table>
    );
  }
};

class TravelsAdminList extends React.Component {
  render() {
    var travelNodes = this.props.data.map(function(travel) {
      return (
        <tr>
          <td>{travel.id}</td>
          <td>{travel.title}</td>
          <td>
            <div className="btn-group" role="group" aria-label="...">
              <a href={"/travels/" + travel.id + "/edit"} className="btn btn-default">Edit</a>
              <a href={"/travels/" + travel.id} data-confirm="Are you sure?" data-method="delete" className="btn btn-danger">Destroy</a>
            </div>
          </td>
        </tr>
      );
    });

    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Administrate</th>
          </tr>
        </thead>
        <tbody>
          {travelNodes}
        </tbody>
      </table>
    );
  }
};