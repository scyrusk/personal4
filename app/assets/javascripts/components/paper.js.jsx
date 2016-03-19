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
  render: function() {
    var noThumb = this.props.assets["noThumb"];
    var assets = this.props.assets;
    var paperNodes = this.props.data.sort(function(a, b) {
      return b.year - a.year;
    }).map(function(paper) {
      return (
        <Paper
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
          downloads={paper.downloads}
          assets={assets}
          id={paper.id}
          key={paper.id} />
      );
    });
    return (
      <div className="paper-list">
        {paperNodes}
      </div>
    );
  }
});

var Paper = React.createClass({
  // Create author nodes here
  render: function() {
    var authors = this.props.authors;
    authors.splice(this.props.selfOrder - 1, 0, { name: "Sauvik Das", id: 0, self: true });
    var authorNodes = authors.map(function(author) {
      return (
        <Author
          name={author.name}
          key={author.id}
          self={author.self || false} />
      );
    });

    var awardNodes = this.props.awards.map(function(award) {
      return (
        <PaperAward
          name={award.body}
          key={award.id} />
      );
    });

    var pdfServeLink = "/papers/" + this.props.id + "/serve";
    var pdfNode = this.props.pdf ?
      <div className="paper-media-link">
        <a href={pdfServeLink}>
          <img className="paper-pdf-icon" src={this.props.assets["pdfDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    var slidesServeLink = this.props.slides || this.props.html_slides_url;
    var slidesNode = slidesServeLink ?
      <div className="paper-media-link">
        <a href={slidesServeLink}>
          <img className="paper-slides-icon" src={this.props.assets["slidesDL"]}/>
        </a>
      </div> :
      <div className="paper-media-link"/>

    return (
      <div className="paper row well well-sm">
        <div className="paper-thumbnail col-xs-3">
          <img className="paper-thumbnail-img" src={this.props.thumbnail} />
        </div>
        <div className="paper-citation col-xs-7">
          <p className="paper-title-line">
            <span className="paper-title">{this.props.title}</span>
            <span className="paper-year"> ({this.props.year})</span>
          </p>
          <div className="paper-author-list">{authorNodes}</div>
          <p className="paper-venue-line">
            <span className="paper-venue">{this.props.venue}</span>
          </p>
          <div className="paper-award-list">{awardNodes}</div>
        </div>
        <div className="paper-media col-xs-2">
          {pdfNode}
          {slidesNode}
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
        slides: this.refs.slides.getValue(),
        html_slides_url: this.refs.htmlSlides.getValue(),
        summary: this.refs.summary.getValue()
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
        <InputField type="text" name="Summary" value={this.state.summary} ref="summary" />
        <SubmitButton/>
      </form>
    );
  }
});