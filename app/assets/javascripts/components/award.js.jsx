var AwardContainer = React.createClass({
  loadAwardsFromServer: function() {
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
  },

  _handleClick: function() {
    if (!this.state.scrollable && this.state.clickCount === 0) {
      gaSendEvent("Interaction", "ToggleScroll", "AwardContainer");
    }
    this.setState({
      scrollable: !this.state.scrollable,
      clickCount: this.state.clickCount + 1
    });
  },

  getInitialState: function() {
    return {
      data: [],
      error: false,
      scrollable: false,
      clickCount: 0
    };
  },

  componentDidMount: function() {
    this.loadAwardsFromServer();
  },

  render: function() {
    var containerClass = this.state.scrollable ?
      "award-list-container scrollable" :
      "award-list-container not-scrollable";

    if (this.state.error) {
      <p className="error">
        Sorry, something seems to have gone wrong. Try refreshing your page?
      </p>
    } else {
      return (
        <div className="award-container"  onClick={this._handleClick}>
          <p className="award-header">
            Honors & Awards
            <span className="header-help"> (click to toggle scroll)</span>
          </p>
          <div className={containerClass}>
            <AwardList data={this.state.data} />
          </div>
        </div>
      );
    }
  }
});

var AwardList = React.createClass({
  render: function() {
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
    }).map(function(award) {
      return (
        <Award
          year={award.year}
          text={award.body}
          paper={award.paper}
          pinned={award.pinned}
          key={award.id} />
      );
    });
    return (
      <div className="award-list">
        {awardNodes}
      </div>
    );
  }
});

var Award = React.createClass({
  render: function() {
    var paperTitle = this.props.paper ?
      <span className="help-block paper-award-paper-title">{this.props.paper.title}</span> :
      <span className="help-block"/>
    var divClass = "award row well well-sm" + (this.props.pinned ? " pinned" : "")
    return (
      <div className={divClass}>
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
});

var PaperAward = React.createClass({
  render: function() {
    return (
      <div className="paper-award" onClick={this.props.handleAwardClick}>
        <span className="paper-award-name">{this.props.name}</span>
      </div>
    );
  }
});

var AwardForm = React.createClass({
  _handleSubmit: function(e) {
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
  },

  _awardPaperOptions: function() {
    return this.props.papers.map(function(paper) {
      return { "value": paper.id, "rendered": paper.title }
    });
  },

  getInitialState: function() {
    return this.props.award;
  },

  render: function() {
    return (
      <form className="paper-form" onSubmit={this._handleSubmit} className="form-horizontal">
        <InputField name="Year" type="number" value={this.state.year} ref="year" />
        <InputField type="text" name="Body" value={this.state.body} ref="body" />
        <SelectField name="Paper" options={this._awardPaperOptions()} value={this.state.paper.id} ref="paperID" />
        <Checkbox name="Pinned" label="Pinned?" ref="pinned" checked={this.state.pinned} />
        <SubmitButton/>
      </form>
    );
  }
});