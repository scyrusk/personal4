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
          <p className="award-header">
            Honors & Awards
          </p>
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
    var awardNodes = this.props.data.sort(function(a, b) {
      return b.year - a.year;
    }).sort(function(a, b) {
      console.log(a.pinned - b.pinned);
      var pinnedComp = b.pinned - a.pinned;
      var yearComp = b.year - a.year;
      if (pinnedComp == 0) {
        return yearComp == 0 ? b.id - a.id : yearComp;
      } else {
        return pinnedComp;
      }
    }).map(function(award, index, arr) {
      return (
        <Award
          year={award.year}
          text={award.body}
          paper={award.paper}
          key={award.id} />
      );
    });
    return (
      <div className="award-list">
        {awardNodes}
      </div>
    );
  }
};

class Award extends React.Component{
  render() {
    var paperTitle = this.props.paper ?
      <span className="help-block paper-award-paper-title">{this.props.paper.title}</span> :
      <span className="help-block"/>
    return (
      <div className="award row well well-sm">
        <div className="award-year col-xs-1">
          {this.props.year}
        </div>
        <div className="award-text col-xs-offset-1 col-xs-10">
          <span className="award-body">{this.props.text}</span>
          {paperTitle}
        </div>
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