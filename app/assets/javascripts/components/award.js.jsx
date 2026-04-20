class AwardContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], error: false };
    this._loadAwardsFromServer = this._loadAwardsFromServer.bind(this);
  }

  _loadAwardsFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({ data: data });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({ error: true });
      }.bind(this)
    });
  }

  componentDidMount() {
    this._loadAwardsFromServer();
  }

  render() {
    if (this.state.error) {
      return <p style={{color: 'var(--text-muted)', padding: '20px 0'}}>Could not load awards. Try refreshing.</p>;
    }
    return <AwardList data={this.state.data} />;
  }
}

class AwardList extends React.Component {
  render() {
    var sorted = this.props.data.slice().sort(function(a, b) {
      var yearA = a.year != null ? Number(a.year) : 0;
      var yearB = b.year != null ? Number(b.year) : 0;
      return yearB !== yearA ? yearB - yearA : (b.id || 0) - (a.id || 0);
    });

    return (
      <div className="honors-list">
        {sorted.map(function(award) {
          return <Award key={award.id} year={award.year} text={award.body} paper={award.paper} />;
        })}
      </div>
    );
  }
}

class Award extends React.Component {
  render() {
    return (
      <div className="honor-item">
        <div className="honor-year">{this.props.year}</div>
        <div className="honor-content">
          <div className="honor-title">{this.props.text}</div>
          {this.props.paper && (
            <div className="honor-venue">{this.props.paper.title}</div>
          )}
        </div>
      </div>
    );
  }
}

class PaperAward extends React.Component {
  render() {
    return (
      <div className="pub-award" onClick={this.props.handleAwardClick}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
          <path d="M5.5 1l1.18 2.4 2.65.38-1.92 1.87.45 2.64L5.5 7.1 3.14 8.29l.45-2.64L1.67 3.78l2.65-.38z"/>
        </svg>
        <span>{this.props.name}</span>
      </div>
    );
  }
}

class AwardForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.award;
    this._handleSubmit = this._handleSubmit.bind(this);
    this._awardPaperOptions = this._awardPaperOptions.bind(this);
  }

  _handleSubmit(e) {
    e.preventDefault();
    var award = {
      award: {
        year: this.refs.year.getValue(),
        body: this.refs.body.getValue(),
        pinned: this.refs.pinned.getChecked(),
        paper_id: this.refs.paperID.getValue()
      }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: this.props.action,
      data: award,
      success: function(data) { window.location.href = "/"; }.bind(this),
      error: function(xhr, status, err) { console.error(this.props.url, status, err.toString()); }.bind(this)
    });

    return false;
  }

  _awardPaperOptions() {
    return this.props.papers.map(function(paper) {
      return { "value": paper.id, "rendered": paper.title };
    });
  }

  render() {
    return (
      <form className="paper-form form-horizontal" onSubmit={this._handleSubmit}>
        <InputField name="Year" type="number" value={this.state.year} ref="year" />
        <InputField type="text" name="Body" value={this.state.body} ref="body" />
        <SelectField name="Paper" options={this._awardPaperOptions()} value={this.state.paper.id} ref="paperID" />
        <Checkbox name="Pinned" label="Pinned?" ref="pinned" checked={this.state.pinned} />
        <SubmitButton/>
      </form>
    );
  }
}
