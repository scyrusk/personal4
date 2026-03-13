class CiteButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, copied: null };
    this._containerRef = null;
    this._toggle = this._toggle.bind(this);
    this._copy = this._copy.bind(this);
  }

  componentDidMount() {
    var self = this;
    this._outsideClick = function(e) {
      if (self._containerRef && !self._containerRef.contains(e.target)) {
        self.setState({ open: false });
      }
    };
    document.addEventListener('click', this._outsideClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._outsideClick);
  }

  _parseName(fullName) {
    var parts = fullName.trim().split(/\s+/);
    return { last: parts[parts.length - 1], firsts: parts.slice(0, -1) };
  }

  _formatAuthorsAPA(authors) {
    var self = this;
    var formatted = authors.map(function(a) {
      var p = self._parseName(a.name);
      var initials = p.firsts.map(function(f) {
        var c = f.replace(/[^A-Za-z]/g, '');
        return c[0] ? c[0].toUpperCase() + '.' : '';
      }).filter(Boolean).join(' ');
      return p.last + (initials ? ', ' + initials : '');
    });
    if (formatted.length <= 1) return formatted[0] || '';
    return formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
  }

  _formatAuthorsMLA(authors) {
    if (!authors.length) return '';
    var self = this;
    var p = self._parseName(authors[0].name);
    var first = p.last + ', ' + p.firsts.join(' ');
    if (authors.length === 1) return first;
    if (authors.length === 2) return first + ', and ' + authors[1].name;
    return first + ', et al';
  }

  _formatAuthorsBibtex(authors) {
    var self = this;
    return authors.map(function(a) {
      var p = self._parseName(a.name);
      return p.last + ', ' + p.firsts.join(' ');
    }).join(' and ');
  }

  _getCitation(format) {
    var title = this.props.title;
    var authors = this.props.authors;
    var venue = this.props.venue;
    var year = this.props.year;
    if (format === 'apa') {
      return this._formatAuthorsAPA(authors) + ' (' + year + '). ' + title + '. ' + venue + '.';
    }
    if (format === 'mla') {
      return this._formatAuthorsMLA(authors) + '. "' + title + '." ' + venue + ', ' + year + '.';
    }
    if (format === 'bibtex') {
      var key = (authors.length > 0 ? this._parseName(authors[0].name).last.toLowerCase() : 'unknown') + year;
      return '@inproceedings{' + key + ',\n' +
        '  author    = {' + this._formatAuthorsBibtex(authors) + '},\n' +
        '  title     = {' + title + '},\n' +
        '  booktitle = {' + venue + '},\n' +
        '  year      = {' + year + '}\n}';
    }
    return '';
  }

  _copy(format, e) {
    e.stopPropagation();
    var self = this;
    navigator.clipboard.writeText(this._getCitation(format)).then(function() {
      self.setState({ copied: format, open: false });
      setTimeout(function() { self.setState({ copied: null }); }, 2000);
    });
  }

  _toggle(e) {
    e.stopPropagation();
    this.setState({ open: !this.state.open });
  }

  render() {
    var self = this;
    var open = this.state.open;
    var copied = this.state.copied;
    return (
      <div className="cite-button-container" ref={function(el) { self._containerRef = el; }}>
        <div className="paper-media-item" onClick={this._toggle} role="button" tabIndex="0"
          aria-label="Copy citation" aria-expanded={String(open)}>
          <svg className="paper-cite-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />
            <path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />
          </svg>
          <span className="paper-media-label">{copied ? '✓ copied' : 'cite'}</span>
        </div>
        {open && (
          <div className="cite-dropdown">
            <button className="cite-option" onClick={function(e) { self._copy('apa', e); }}>APA</button>
            <button className="cite-option" onClick={function(e) { self._copy('mla', e); }}>MLA</button>
            <button className="cite-option" onClick={function(e) { self._copy('bibtex', e); }}>BibTeX</button>
          </div>
        )}
      </div>
    );
  }
}

function randomString(n) {
  s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  Array.apply(null, Array(n)).map(() => s.charAt(Math.floor(Math.random() * s.length))).join('')
}

class PaperContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {data: []};
    this.loadPapersFromServer = this.loadPapersFromServer.bind(this);
  }

  loadPapersFromServer() {
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
  }

  componentDidMount() {
    this.loadPapersFromServer();
  }

  render() {
    return (
      <div className="paper-container">
        <div className="paper-list-container">
          <PaperList 
            data={this.state.data} 
            assets={this.props.assets} 
            studentFilter={this.props.studentFilter}
            currentStudents={this.props.currentStudents}
            alums={this.props.alums}
          />
        </div>
      </div>
    );
  }
};

class PaperList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: "",
      timeoutVar: null
    }
    this._handleFilterClick = this._handleFilterClick.bind(this);
    this._handleFilterTextChanged = this._handleFilterTextChanged.bind(this);
  }

  componentDidMount() {
    // Listen for student filter changes
    this.handleStudentFilterChange = (event) => {
      this._handleFilterTextChanged(event.detail.studentName || "");
    };
    window.addEventListener('studentFilterChanged', this.handleStudentFilterChange);
  }

  componentWillUnmount() {
    // Clean up event listener
    window.removeEventListener('studentFilterChanged', this.handleStudentFilterChange);
  }

  componentDidUpdate(prevProps) {
    // If student filter changed, update the filter text
    if (prevProps.studentFilter !== this.props.studentFilter) {
      this._handleFilterTextChanged(this.props.studentFilter || "");
    }
  }

  _handleFilterClick(e) {
    this.setState({ filterText: e.target.innerText })
    $('html,body').animate({scrollTop: $('.paper-container').offset().top });
  }

  _handleFilterTextChanged(ft) {
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
    });

    // Dispatch search change event for StudentsContainer to listen
    const event = new CustomEvent('searchFilterChanged', { 
      detail: { searchTerm: ft } 
    });
    window.dispatchEvent(event);
  }


  render() {
    var stateRef = this.state;
    var noThumb = this.props.assets["noThumb"];
    var assets = this.props.assets;
    var filterClickListener = this._handleFilterClick;

    var paperNodes = this.props.data.map(function(paper) {
      // Function to escape special characters in the search query
      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      var ft = escapeRegExp(stateRef.filterText.toLowerCase());
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
          key={randomString(8)} />
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
};

class PaperFilter extends React.Component {
  constructor(props) {
    super(props);
    this.handleTextChanged = this.handleTextChanged.bind(this);
  }

  handleTextChanged(e) {
    this.props.onFilter(e.target.value);
  }

  render() {
    return (
      <div className="paper-list-search col-xs-12">
        <input
          type="text"
          placeholder="Search by title, author, venue, tag, or award"
          className="form-control paperFilter"
          value={this.props.initialText}
          onChange={this.handleTextChanged} />
      </div>
    );
  }
};

class Paper extends React.Component {
  // Create author nodes here
  render() {
    var filterClickListener = this.props.handleFilterClick;
    // var authors = this.props.authors;
    // authors.splice(this.props.selfOrder - 1, 0, { name: "Sauvik Das", id: 0, self: true });
    var authorNodes = this.props.authors.map(function(author, idx, arr) {
      var isLast = idx === arr.length - 1;
      return (
        <span key={randomString(8)}>
          <Author
            name={author.name}
            handleAuthorClick={filterClickListener}
            self={author.self || false} />
          {!isLast && <span className="author-sep">, </span>}
        </span>
      );
    });

    var awardNodes = this.props.awards.map(function(award) {
      return (
        <PaperAward
          name={award.body}
          handleAwardClick={filterClickListener}
          key={randomString(8)} />
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
        <a href={pdfServeLink} target="_blank" className="paper-media-item" aria-label={"PDF: " + this.props.title}>
          <img className="paper-pdf-icon" src={this.props.assets["pdfDL"]}/>
          <span className="paper-media-label">pdf</span>
        </a>
      </div> :
      null;


    var slidesServeLink = this.props.slides || this.props.html_slides_url;
    var slidesEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'SlidesDownload', id);
    };

    var slidesNode = slidesServeLink ?
      <div className="paper-media-link" onClick={slidesEventTracking}>
        <a href={slidesServeLink} className="paper-media-item" aria-label={"Slides: " + this.props.title}>
          <img className="paper-slides-icon" src={this.props.assets["slidesDL"]}/>
          <span className="paper-media-label">slides</span>
        </a>
      </div> :
      null;

    var prezServeLink = this.props.presentation_url;
    var prezEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'PrezLink', id);
    };

    var prezNode = prezServeLink ?
      <div className="paper-media-link" onClick={prezEventTracking}>
        <a href={prezServeLink} target="_blank" className="paper-media-item" aria-label={"Presentation: " + this.props.title}>
          <img className="paper-slides-icon" src={this.props.assets["prezDL"]}/>
          <span className="paper-media-label">talk</span>
        </a>
      </div> :
      null;

    var videoServeLink = this.props.video_url;
    var videoEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'VideoLink', id);
    };

    var tweetEventTracking = function(id) {
      return () => gaSendEvent('Publications', 'TweetLink', id);
    }

    var videoNode = videoServeLink ?
      <div className="paper-media-link" onClick={videoEventTracking}>
        <a href={videoServeLink} target="_blank" className="paper-media-item" aria-label={"Video: " + this.props.title}>
          <img className="paper-slides-icon" src={this.props.assets["videoDL"]}/>
          <span className="paper-media-label">video</span>
        </a>
      </div> :
      null;

    var tweetsNode = this.props.tweets ?
      <div className="paper-media-link" onClick={tweetEventTracking}>
        <a href={this.props.tweets} target="_blank" className="paper-media-item" aria-label={"Paper summary thread: " + this.props.title}>
          <svg className="paper-thread-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
            <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
          </svg>
          <span className="paper-media-label">summary</span>
        </a>
      </div> :
      null;

    var paperClassName = this.props.selected ? "paper row" : "paper row unselected";

    return (
      <div className={paperClassName}>
        <div className="paper-thumbnail col-xs-3">
          <img className="paper-thumbnail-img" src={this.props.thumbnail} />
        </div>
        <div className="paper-body col-xs-9">
          <p className="paper-title-line">
            <span className="paper-title">{this.props.title}</span>
            <span className="paper-year" onClick={filterClickListener}> ({this.props.year})</span>
          </p>
          <div className="paper-author-list">{authorNodes}</div>
          <p className="paper-venue-line">
            <span className="paper-venue" onClick={filterClickListener}>{this.props.venue}</span>
          </p>
          <div className="paper-award-list">{awardNodes}</div>
          <div className="paper-media">
            {pdfNode}{slidesNode}{prezNode}{videoNode}{tweetsNode}
            <CiteButton title={this.props.title} authors={this.props.authors} venue={this.props.venue} year={this.props.year} />
          </div>
          <div className="paper-tags">{tagNodes}</div>
        </div>
      </div>
    );
  }
};

class PaperForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.paper;
    this._handleSubmit = this._handleSubmit.bind(this);
  }

  _handleSubmit(e) {
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
  }

  _paperTypeOptions() {
    return [
      { value: 0, "rendered": "Conference" },
      { value: 1, "rendered": "Journal" },
      { value: 2, "rendered": "Workshop" }
    ];
  }

  render() {
    var authorsValue = this.state.authors.map(function(author) {
      return author.name;
    }).join(", ");

    var awardsValue = this.state.awards.map(function(award) {
      return award.body;
    }).join(", ");

    return (
      <form className="paper-form form-horizontal" onSubmit={this._handleSubmit} encType="multipart/form-data">
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
};