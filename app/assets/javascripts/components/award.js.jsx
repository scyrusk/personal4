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
    var a = props.award || {};
    this.state = {
      year:     a.year != null ? String(a.year) : '',
      body:     a.body || '',
      pinned:   !!a.pinned,
      paper_id: a.paper ? a.paper.id : ''
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
    var award = {
      award: {
        year:     s.year,
        body:     s.body,
        pinned:   s.pinned,
        paper_id: s.paper_id
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

  render() {
    var s = this.state;
    var paperOptions = this.props.papers.map(function(paper) {
      return { value: paper.id, rendered: paper.title };
    });
    return (
      <form className="paper-form form-horizontal" onSubmit={this._handleSubmit}>
        <InputField name="Year"   type="number" value={s.year}     onChange={this._set('year')} />
        <InputField name="Body"   type="text"   value={s.body}     onChange={this._set('body')} />
        <SelectField name="Paper" options={paperOptions}  value={s.paper_id} onChange={this._set('paper_id')} />
        <Checkbox name="Pinned" label="Pinned?" checked={s.pinned} onChange={this._set('pinned')} />
        <SubmitButton/>
      </form>
    );
  }
}
