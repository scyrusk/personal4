class AwardContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      error: false,
      scrollable: false,
      clickCount: 0
    };
    this._handleClick = this._handleClick.bind(this);
    this._loadAwardsFromServer = this._loadAwardsFromServer.bind(this);
  }

  _loadAwardsFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({error: true});
      }.bind(this)
    });
  }

  _handleClick() {
    this.setState({
      scrollable: !this.state.scrollable,
      clickCount: this.state.clickCount + 1
    });
    console.log(this.state.scrollable);
  }

  componentDidMount() {
    this._loadAwardsFromServer();
  }

  render() {
    var containerClass = "award-list-container not-scrollable";

    if (this.state.error) {
      <p className="error">
        Sorry, something seems to have gone wrong. Try refreshing your page?
      </p>
    } else {
      return (
        <div className="award-container"  onClick={this._handleClick}>
          <div className={containerClass}>
            <AwardList data={this.state.data} />
          </div>
        </div>
      );
    }
  }
};

class AwardList extends React.Component {
  render() {
    const grouped = {};
    this.props.data.forEach(function(award) {
      const year = award.year || 'Unknown';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(award);
    });

    const years = Object.keys(grouped).sort(function(a, b) { return Number(b) - Number(a); });

    const timelineNodes = years.map(function(year) {
      const awards = grouped[year].slice().sort(function(a, b) {
        const pinnedComp = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return pinnedComp !== 0 ? pinnedComp : (a.id || 0) - (b.id || 0);
      });
      return (
        <div key={year} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="award-year-label">{year}</div>
            {awards.map(function(award) {
              return (
                <Award
                  text={award.body}
                  paper={award.paper}
                  pinned={award.pinned}
                  key={award.id} />
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="awards-timeline">
        {timelineNodes}
      </div>
    );
  }
};

class Award extends React.Component{
  render() {
    var paperTitle = this.props.paper ?
      <div className="award-paper-title">{this.props.paper.title}</div> :
      null;
    var className = "award-item" + (this.props.pinned ? " award-pinned" : "");
    return (
      <div className={className}>
        <span className="award-body">{this.props.text}</span>
        {paperTitle}
      </div>
    );
  }
};

class PaperAward extends React.Component {
  render() {
    return (
      <div className="paper-award" onClick={this.props.handleAwardClick}>
        <span className="paper-award-name">{this.props.name}</span>
      </div>
    );
  }
};

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
      success: function(data) {
        window.location.href = "/"
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    return false;
  }

  _awardPaperOptions() {
    return this.props.papers.map(function(paper) {
      return { "value": paper.id, "rendered": paper.title }
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
};