var PaperContainer = React.createClass({
  loadPapersFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data.reverse()});
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
    this.loadPapersFromServer();
  },

  render: function() {
    return (
      <div className="paper-container">
        <p className="paper-header">Selected Publications</p>
        <div className="paper-list-container">
          <PaperList data={this.state.data} assets={this.props.assets} />
        </div>
      </div>
    );
  }
});

var PaperList = React.createClass({
  getInitialState: function() {
    return {
      filterText: "",
      timeoutVar: null
    }
  },

  _handleFilterClick: function(e) {
    this.setState({ filterText: e.target.innerText })
    gaSendEvent("Interaction", "Search", e.target.innerText);
    $('html,body').animate({scrollTop: $('.paper-container').offset().top });
  },

  _handleFilterTextChanged: function(ft) {
    if (this.state.timeoutVar != null) {
      clearTimeout(this.state.timeoutVar);
    }

    var tv = null;
    if (ft != "") {
      tv = setTimeout(() => { gaSendEvent("Interaction", "Search", ft); }, 5000);
    }

    this.setState({
      filterText: ft,
      timeoutVar: tv
    })
  },

  render: function() {
    var stateRef = this.state;
    var noThumb = this.props.assets["noThumb"];
    var assets = this.props.assets;
    var filterClickListener = this._handleFilterClick;

    var paperNodes = this.props.data.map(function(paper) {
      var ft = stateRef.filterText.toLowerCase();
      paper.selected = (
        ft === "" ||
        paper.title.toLowerCase().search(ft) >= 0 ||
        paper.venue.toLowerCase().indexOf(ft) >= 0 ||
        paper.year.toString().indexOf(ft) >= 0 ||
        paper.authors.some(function(e,i,a) { return e.name.toLowerCase().search(ft) >= 0 }) ||
        paper.awards.some(function(e,i,a) { return e.body.toLowerCase().search(ft) >= 0 }) ||
        (paper.tags || "").toLowerCase().search(ft) >= 0
      );
      return paper;
    }).sort(function(a, b) {
      var selectedComp = b.selected - a.selected;
      var yearComp = b.year - a.year;
      if (selectedComp == 0) {
        return yearComp == 0 ? b.id - a.id : yearComp;
      } else {
        return selectedComp;
      }
    }).map(function(paper, index) {
      return (
        <Paper
          handleFilterClick={filterClickListener}
          selected={paper.selected}
          type={paper.type}
          thumbnail={paper.thumbnail || noThumb}
          selfOrder={paper.selfOrder}
          title={paper.title}
          authors={paper.authors}
          venue={paper.venue}
          year={paper.year}
          pdf={paper.pdf}
          summary={paper.summary}
          awards={paper.awards}
          slides={paper.slides}
          html_slides_url={paper.html_slides_url}
          html_paper_url={paper.html_paper_url}
          presentation_url={paper.presentation_url}
          video_url={paper.video_url}
          downloads={paper.downloads}
          tags={paper.tags || ""}
          tweets={paper.tweets}
          assets={assets}
          id={paper.id}
          key={Utility.randomString(8)} />
      );
    });
    return (
      <div className="paper-list">
        <div className="paper-filter row">
          <PaperFilter onFilter={this._handleFilterTextChanged} initialText={this.state.filterText} />
        </div>
        {paperNodes}
      </div>
    );
  }
});

var PaperFilter = React.createClass({
  handleTextChanged: function(e) {
    this.props.onFilter(e.target.value);
  },

  render: function() {
    return (
      <div className="paper-list-search col-xs-12">
        <input
          type="text"
          placeholder="Search by title, author, venue or award"
          className="form-control paperFilter"
          value={this.props.initialText}
          onChange={this.handleTextChanged} />
      </div>
    );
  }
});

var Paper = React.createClass({
  // Create author nodes here
  render: function() {
    var filterClickListener = this.props.handleFilterClick;
    // var authors = this.props.authors;
    // authors.splice(this.props.selfOrder - 1, 0, { name: "Sauvik Das", id: 0, self: true });
    var authorNodes = this.props.authors.map(function(author) {
      return (
        <Author
          name={author.name}
          key={Utility.randomString(8)}
          handleAuthorClick={filterClickListener}
          self={author.self || false} />
      );
    });

    var awardNodes = this.props.awards.map(function(award) {
      return (
        <PaperAward
          name={award.body}
          handleAwardClick={filterClickListener}
          key={Utility.randomString(8)} />
      );
    });

    var tagEls = this.props.tags !== "" ? this.props.tags.split(";").map(function(tag) {
      return (
        <span className="paper-tag" onClick={filterClickListener}>{ tag }</span>
      );
    }) : null;

    var tagNodes = tagEls ? (
      <div className="paper-tags">
        <b>Tags: </b>
        { tagEls }
      </div>
    ) : null;


    var pdfServeLink = this.props.html_paper_url || "/papers/" + this.props.id + "/serve";
    var pdfEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'PDFDownload', id);
    };

    var pdfNode = (this.props.pdf || this.props.html_paper_url) ?
      <div className="paper-media-link" onClick={pdfEventTracking(this.props.id)}>
        <a href={pdfServeLink}>
          <img className="paper-pdf-icon" src={this.props.assets["pdfDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    var slidesServeLink = this.props.slides || this.props.html_slides_url;
    var slidesEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'SlidesDownload', id);
    };

    var slidesNode = slidesServeLink ?
      <div className="paper-media-link" onClick={slidesEventTracking}>
        <a href={slidesServeLink}>
          <img className="paper-slides-icon" src={this.props.assets["slidesDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    var prezServeLink = this.props.presentation_url;
    var prezEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'PrezLink', id);
    };

    var prezNode = prezServeLink ?
      <div className="paper-media-link" onClick={prezEventTracking}>
        <a href={prezServeLink} target="_blank">
          <img className="paper-slides-icon" src={this.props.assets["prezDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    var videoServeLink = this.props.video_url;
    var videoEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'VideoLink', id);
    };

    var videoNode = videoServeLink ?
      <div className="paper-media-link" onClick={videoEventTracking}>
        <a href={videoServeLink} target="_blank">
          <img className="paper-slides-icon" src={this.props.assets["videoDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>
    
    var tweetsNode = this.props.tweets ?
      <div className="paper-media-link" onClick={videoEventTracking}>
        <a href={this.props.tweets} target="_blank">
          <img className="paper-tweets-icon" src={this.props.assets["tweetsDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    var paperClassName = this.props.selected ? "paper row well well-sm" : "paper row well well-sm unselected";

    return (
      <div className={paperClassName}>
        <div className="paper-thumbnail col-xs-3">
          <img className="paper-thumbnail-img" src={this.props.thumbnail} />
        </div>
        <div className="paper-citation col-xs-7">
          <p className="paper-title-line">
            <span className="paper-title">{this.props.title}</span>
            <span className="paper-year" onClick={filterClickListener}> ({this.props.year})</span>
          </p>
          <div className="paper-author-list">{authorNodes}</div>
          <p className="paper-venue-line">
            <span className="paper-venue" onClick={filterClickListener}>{this.props.venue}</span>
          </p>
          <div className="paper-award-list">{awardNodes}</div>
          <div className="paper-tags">{tagNodes}</div>
        </div>
        <div className="paper-media col-xs-2">
          {pdfNode}
          {slidesNode}
          {prezNode}
          {videoNode}
          {tweetsNode}
        </div>
      </div>
    );
  }
});

var PaperForm = React.createClass({
  _handleSubmit: function(e) {
    e.preventDefault();
    var paper = {
      paper: {
        title: this.refs.title.getValue(),
        venue: this.refs.venue.getValue(),
        year: this.refs.year.getValue(),
        self_order: this.refs.selfOrder.getValue(),
        authors: this.refs.authors.getValue(),
        awards: this.refs.awards.getValue(),
        backing_type: this.refs.type.getValue(),
        thumbnail: this.refs.thumbnail.getValue(),
        pdf: this.refs.pdf.getValue(),
        downloads: this.refs.downloads.getValue(),
        slides: this.refs.slides.getValue(),
        html_slides_url: this.refs.htmlSlides.getValue(),
        html_paper_url: this.refs.htmlPaper.getValue(),
        presentation_url: this.refs.presentation.getValue(),
        video_url: this.refs.video.getValue(),
        summary: this.refs.summary.getValue(),
        tweets: this.refs.tweets.getValue(),
        tags: this.refs.tags.getValue()
      }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: this.props.action,
      data: paper,
      success: function(data) {
        window.location.href = "/"
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    return false;
  },

  _paperTypeOptions: function() {
    return [
      { value: 0, "rendered": "Conference" },
      { value: 1, "rendered": "Journal" },
      { value: 2, "rendered": "Workshop" }
    ];
  },

  getInitialState: function() {
    return this.props.paper;
  },

  render: function() {
    var authorsValue = this.state.authors.map(function(author) {
      return author.name;
    }).join(", ");

    var awardsValue = this.state.awards.map(function(award) {
      return award.body;
    }).join(", ");

    return (
      <form className="paper-form" onSubmit={this._handleSubmit} className="form-horizontal" encType="multipart/form-data">
        <InputField name="Title" type="text" value={this.state.title} ref="title" />
        <InputField name="Venue" type="text" value={this.state.venue} ref="venue" />
        <InputField name="Self Order" type="number" value={this.state.selfOrder} ref="selfOrder" />
        <InputField name="Year" type="number" value={this.state.year} ref="year" />
        <InputField type="text" name="Authors" value={authorsValue} ref="authors" />
        <InputField type="text" name="Awards" value={awardsValue} ref="awards" />
        <SelectField name="Type" options={this._paperTypeOptions()} value={this.state.type} ref="type" />
        <FileField name="Thumbnail" ref="thumbnail" />
        <FileField name="PDF" ref="pdf" />
        <FileField name="Slides" ref="slides" />
        <InputField type="text" name="HTML Slides" value={this.state.html_slides_url} ref="htmlSlides" />
        <InputField type="text" name="HTML Paper" value={this.state.html_paper_url} ref="htmlPaper" />
        <InputField type="text" name="Presentation URL" value={this.state.presentation_url} ref="presentation" />
        <InputField type="text" name="Video URL" value={this.state.video_url} ref="video" />
        <InputField type="text" name="Tweet URL" value={this.state.tweets} ref="tweets" />
        <InputField type="text" name="Summary" value={this.state.summary} ref="summary" />
        <InputField type="text" name="Tags" value={this.state.tags} ref="tags" />
        <InputField name="Downloads" type="number" value={this.state.downloads} ref="downloads" />
        <SubmitButton/>
      </form>
    );
  }
});