function randomString(n) {
  var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.apply(null, Array(n)).map(function() {
    return s.charAt(Math.floor(Math.random() * s.length));
  }).join('');
}

// ── FILTER HELPERS ──────────────────────────────────────
var FILTER_MAP = {
  "Recent": function(p) { return p.year >= 2024; },
  "AI & Privacy": function(p) {
    var tags = (p.tags || "").toLowerCase();
    return tags.indexOf("privacy") >= 0 || tags.indexOf("ai") >= 0;
  },
  "Security": function(p) {
    var tags = (p.tags || "").toLowerCase();
    return tags.indexOf("security") >= 0 || tags.indexOf("privacy") >= 0;
  },
  "Award-winning": function(p) { return p.awards && p.awards.length > 0; }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paperMatchesQuery(paper, ft) {
  if (ft === "") return true;
  var re = escapeRegExp(ft);
  return (
    paper.title.toLowerCase().search(re) >= 0 ||
    paper.venue.toLowerCase().indexOf(ft) >= 0 ||
    paper.year.toString().indexOf(ft) >= 0 ||
    paper.authors.some(function(a) { return a.name.toLowerCase().search(re) >= 0; }) ||
    paper.awards.some(function(a) { return a.body.toLowerCase().search(re) >= 0; }) ||
    (paper.tags || "").toLowerCase().search(re) >= 0
  );
}

// ── PAPER CONTAINER ──────────────────────────────────────
class PaperContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [] };
    this.loadPapersFromServer = this.loadPapersFromServer.bind(this);
  }

  loadPapersFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({ data: data.reverse() });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  }

  componentDidMount() {
    this.loadPapersFromServer();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.query !== this.props.query ||
        prevProps.activeFilter !== this.props.activeFilter ||
        prevState.data !== this.state.data) {
      if (this.props.onResultCount) {
        var count = this.getFilteredCount();
        this.props.onResultCount(count);
      }
    }
  }

  getFilteredCount() {
    var query = (this.props.query || "").toLowerCase().trim();
    var activeFilter = this.props.activeFilter;
    return this.state.data.filter(function(paper) {
      var matchQ = paperMatchesQuery(paper, query);
      var matchF = !activeFilter || (FILTER_MAP[activeFilter] && FILTER_MAP[activeFilter](paper));
      return matchQ && matchF;
    }).length;
  }

  render() {
    return (
      <PaperList
        data={this.state.data}
        assets={this.props.assets}
        query={this.props.query || ""}
        activeFilter={this.props.activeFilter || null}
      />
    );
  }
}

// ── PAPER LIST ────────────────────────────────────────────
class PaperList extends React.Component {
  render() {
    var query = (this.props.query || "").toLowerCase().trim();
    var activeFilter = this.props.activeFilter;
    var assets = this.props.assets;
    var noThumb = assets && assets["noThumb"];

    // Filter papers
    var filtered = this.props.data.filter(function(paper) {
      var matchQ = paperMatchesQuery(paper, query);
      var matchF = !activeFilter || (FILTER_MAP[activeFilter] && FILTER_MAP[activeFilter](paper));
      return matchQ && matchF;
    });

    // Sort: by year desc, then id desc
    filtered = filtered.slice().sort(function(a, b) {
      return b.year !== a.year ? b.year - a.year : b.id - a.id;
    });

    // Group by year
    var byYear = {};
    filtered.forEach(function(paper) {
      if (!byYear[paper.year]) byYear[paper.year] = [];
      byYear[paper.year].push(paper);
    });
    var years = Object.keys(byYear).sort(function(a, b) { return b - a; });

    if (years.length === 0) {
      return (
        <div style={{padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px'}}>
          No papers match your search.
        </div>
      );
    }

    return (
      <div className="paper-list">
        {years.map(function(year) {
          return (
            <div key={year} className="year-group">
              <div className="year-label">{year}</div>
              {byYear[year].map(function(paper) {
                var thumb = paper.thumbnail || noThumb;
                return (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    thumbnail={thumb}
                    assets={assets}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
}

// ── CITATION FORMATTERS ───────────────────────────────────
function formatNameLastFirst(fullName) {
  var parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  var last = parts[parts.length - 1];
  var first = parts.slice(0, -1).join(' ');
  return last + ', ' + first;
}

function formatNameInitials(fullName) {
  var parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  var last = parts[parts.length - 1];
  var initials = parts.slice(0, -1).map(function(p) { return p[0].toUpperCase() + '.'; }).join(' ');
  return last + ', ' + initials;
}

function buildMLA(paper) {
  var names = paper.authors.map(function(a) { return a.name; });
  var authorStr;
  if (names.length === 1) {
    authorStr = formatNameLastFirst(names[0]);
  } else if (names.length <= 3) {
    authorStr = formatNameLastFirst(names[0]) + ', ' + names.slice(1).join(', ');
  } else {
    authorStr = formatNameLastFirst(names[0]) + ', et al';
  }
  return authorStr + '. "' + paper.title + '." ' + paper.venue + ', ' + paper.year + '.';
}

function buildAPA(paper) {
  var names = paper.authors.map(function(a) { return a.name; });
  var formatted = names.map(formatNameInitials);
  var authorStr;
  if (formatted.length === 1) {
    authorStr = formatted[0];
  } else if (formatted.length <= 7) {
    authorStr = formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
  } else {
    authorStr = formatted.slice(0, 6).join(', ') + ', ... ' + formatted[formatted.length - 1];
  }
  return authorStr + ' (' + paper.year + '). ' + paper.title + '. ' + paper.venue + '.';
}

function buildBibTeX(paper) {
  var names = paper.authors.map(function(a) { return a.name; });
  var firstLast = names[0].trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  var key = firstLast + paper.year;
  return (
    '@inproceedings{' + key + ',\n' +
    '  author    = {' + names.join(' and ') + '},\n' +
    '  title     = {{' + paper.title + '}},\n' +
    '  booktitle = {' + paper.venue + '},\n' +
    '  year      = {' + paper.year + '}\n' +
    '}'
  );
}

// ── PAPER CARD ────────────────────────────────────────────
class PaperCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tagsExpanded: false,
      citeOpen: false,
      copiedFormat: null
    };
    this.citeWrapRef = React.createRef();
    this.handleCiteToggle = this.handleCiteToggle.bind(this);
    this.handleCopyFormat = this.handleCopyFormat.bind(this);
    this.handleDocClick = this.handleDocClick.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocClick);
    if (this._copyTimer) clearTimeout(this._copyTimer);
  }

  handleDocClick(e) {
    if (this.citeWrapRef.current && !this.citeWrapRef.current.contains(e.target)) {
      if (this.state.citeOpen) this.setState({ citeOpen: false });
    }
  }

  handleCiteToggle(e) {
    e.stopPropagation();
    this.setState(function(prev) {
      return { citeOpen: !prev.citeOpen, copiedFormat: null };
    });
  }

  handleCopyFormat(fmt, e) {
    e.stopPropagation();
    var paper = this.props.paper;
    var text = fmt === 'MLA' ? buildMLA(paper) : fmt === 'APA' ? buildAPA(paper) : buildBibTeX(paper);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function() {});
    this.setState({ copiedFormat: fmt });
    if (this._copyTimer) clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(function() {
      this.setState({ copiedFormat: null });
    }.bind(this), 2000);
    gaSendEvent('Publications', 'CopyCitation', fmt);
  }

  setFilter(value) {
    window.dispatchEvent(new CustomEvent('setSearchFilter', { detail: { value: value } }));
    gaSendEvent('Interaction', 'Search', value);
  }

  render() {
    var paper = this.props.paper;
    var tagsExpanded = this.state.tagsExpanded;
    var citeOpen = this.state.citeOpen;
    var copiedFormat = this.state.copiedFormat;
    var MAX_TAGS = 3;

    // Authors: show all if ≤4; otherwise first 2 + "+N others" + self (if not already in first 2)
    var authors = paper.authors;
    var displayAuthors;
    if (authors.length <= 4) {
      displayAuthors = authors.map(function(a) { return a.name; });
    } else {
      var first2Names = authors.slice(0, 2).map(function(a) { return a.name; });
      var selfAuthor = authors.find(function(a) { return a.self; });
      var selfName = selfAuthor ? selfAuthor.name : "Sauvik Das";
      var selfInFirst2 = first2Names.indexOf(selfName) >= 0;
      if (selfInFirst2) {
        // self already shown — just collapse the rest
        displayAuthors = first2Names.concat(["+" + (authors.length - 2) + " others"]);
      } else {
        displayAuthors = first2Names.concat(["+" + (authors.length - 3) + " others", selfName]);
      }
    }

    // Tags: split from semicolon string
    var allTags = paper.tags ? paper.tags.split(";").map(function(t) { return t.trim(); }).filter(Boolean) : [];
    var visibleTags = tagsExpanded ? allTags : allTags.slice(0, MAX_TAGS);
    var hiddenCount = allTags.length - MAX_TAGS;

    // Award: first award body
    var firstAward = paper.awards && paper.awards.length > 0 ? paper.awards[0].body : null;

    // PDF link
    var pdfLink = paper.html_paper_url || ("/papers/" + paper.id + "/serve");
    var hasPDF = paper.pdf || paper.html_paper_url;

    // Summary link
    var summaryLink = paper.summary;

    return (
      <div className="pub-card">
        <div className="pub-card-inner">
          <div className="pub-thumb">
            {this.props.thumbnail ? (
              <img src={this.props.thumbnail} alt="" />
            ) : (
              <div className="pub-thumb-placeholder">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="5" y="4" width="18" height="20" rx="2" stroke="#2a6b3c" strokeWidth="1.5"/>
                  <line x1="9" y1="10" x2="19" y2="10" stroke="#2a6b3c" strokeWidth="1.2"/>
                  <line x1="9" y1="14" x2="19" y2="14" stroke="#2a6b3c" strokeWidth="1.2"/>
                  <line x1="9" y1="18" x2="15" y2="18" stroke="#2a6b3c" strokeWidth="1.2"/>
                </svg>
              </div>
            )}
          </div>

          <div className="pub-content">
            {firstAward && (
              <div className="pub-award">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                  <path d="M5.5 1l1.18 2.4 2.65.38-1.92 1.87.45 2.64L5.5 7.1 3.14 8.29l.45-2.64L1.67 3.78l2.65-.38z"/>
                </svg>
                {firstAward}
              </div>
            )}

            <a
              className="pub-title"
              href={hasPDF ? pdfLink : "#"}
              target={hasPDF ? "_blank" : undefined}
              onClick={hasPDF ? function(e) { gaSendEvent('Publications', 'PDFDownload', paper.id); } : function(e) { e.preventDefault(); }}
            >
              {paper.title}
            </a>

            <div className="pub-authors">
              {displayAuthors.map(function(name, i) {
                var isSelf = name === "Sauvik Das";
                var isPlaceholder = name.charAt(0) === '+';
                return (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    {isPlaceholder ? (
                      <span style={{color: 'var(--text-muted)'}}>{name}</span>
                    ) : isSelf ? (
                      <strong>{name}</strong>
                    ) : (
                      <span
                        className="pub-author-link"
                        onClick={() => this.setFilter(name)}
                        title={"Filter by " + name}
                      >{name}</span>
                    )}
                  </span>
                );
              }.bind(this))}
            </div>

            <div className="pub-venue">
              <span
                className="pub-venue-link"
                onClick={() => this.setFilter(paper.venue)}
                title={"Filter by venue"}
              >{paper.venue}</span>
              {' · '}
              <span
                className="pub-venue-link"
                onClick={() => this.setFilter(paper.year.toString())}
                title={"Filter by year"}
              >{paper.year}</span>
            </div>

            {allTags.length > 0 && (
              <div className="pub-tags">
                {visibleTags.map(function(tag) {
                  return (
                    <span
                      key={tag}
                      className="pub-tag"
                      onClick={() => this.setFilter(tag)}
                      title={"Filter by tag: " + tag}
                      style={{cursor: 'pointer'}}
                    >{tag}</span>
                  );
                }.bind(this))}
                {!tagsExpanded && hiddenCount > 0 && (
                  <button
                    className="pub-tag-more"
                    onClick={() => this.setState({ tagsExpanded: true })}
                  >+{hiddenCount} more</button>
                )}
              </div>
            )}

            <div className="pub-actions">
              {hasPDF && (
                <a
                  className="pub-action-primary"
                  href={pdfLink}
                  target="_blank"
                  aria-label={"View PDF: " + paper.title}
                  onClick={function() { gaSendEvent('Publications', 'PDFDownload', paper.id); }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1zm0 1.5L12.5 5H9V2.5zM5.5 9.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm0-2h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm0 4h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1z"/>
                  </svg>
                  {' '}View PDF
                </a>
              )}

              {summaryLink && (
                <a
                  className="pub-action-secondary"
                  href={summaryLink}
                  target="_blank"
                  aria-label={"Read summary: " + paper.title}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2h12v2H2V2zm0 4h8v2H2V6zm0 4h10v2H2v-2z"/>
                  </svg>
                  {' '}Summary
                </a>
              )}

              {paper.slides && (
                <a
                  className="pub-action-secondary"
                  href={paper.slides}
                  target="_blank"
                  aria-label={"View slides: " + paper.title}
                  onClick={function() { gaSendEvent('Publications', 'SlidesDownload', paper.id); }}
                >Slides</a>
              )}

              {paper.video_url && (
                <a
                  className="pub-action-secondary"
                  href={paper.video_url}
                  target="_blank"
                  aria-label={"Watch video: " + paper.title}
                >Video</a>
              )}

              <div className="cite-wrapper" ref={this.citeWrapRef}>
                <button
                  className={'pub-action-secondary' + (citeOpen ? ' cite-active' : '')}
                  onClick={this.handleCiteToggle}
                  aria-haspopup="true"
                  aria-expanded={citeOpen}
                  aria-label={"Cite: " + paper.title}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{display:'inline',verticalAlign:'middle'}}>
                    <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                  {' '}Cite{citeOpen ? ' ▲' : ' ▾'}
                </button>

                {citeOpen && (
                  <div className="cite-dropdown" role="dialog" aria-label="Citation formats">
                    {['MLA', 'APA', 'BibTeX'].map(function(fmt) {
                      var isCopied = copiedFormat === fmt;
                      var fmtText = fmt === 'MLA' ? buildMLA(paper)
                                  : fmt === 'APA' ? buildAPA(paper)
                                  : buildBibTeX(paper);
                      var isBibtex = fmt === 'BibTeX';
                      return (
                        <div key={fmt} className="cite-row">
                          <div className="cite-row-header">
                            <span className="cite-format-badge">{fmt}</span>
                            <button
                              className={'cite-copy-btn' + (isCopied ? ' copied' : '')}
                              onClick={function(e) { this.handleCopyFormat(fmt, e); }.bind(this)}
                            >
                              {isCopied ? (
                                <span>✓ Copied</span>
                              ) : 'Copy'}
                            </button>
                          </div>
                          {isBibtex ? (
                            <pre className="cite-text cite-text-pre">{fmtText}</pre>
                          ) : (
                            <p className="cite-text">{fmtText}</p>
                          )}
                        </div>
                      );
                    }.bind(this))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ── LEGACY CLASSES (kept for admin form compatibility) ────
class PaperFilter extends React.Component {
  constructor(props) {
    super(props);
    this.handleTextChanged = this.handleTextChanged.bind(this);
  }
  handleTextChanged(e) { this.props.onFilter(e.target.value); }
  render() {
    return (
      <div className="pubs-search-wrap" style={{marginBottom: 12}}>
        <input
          type="text"
          placeholder="Search by title, author, venue, tag, or award"
          className="pubs-search"
          style={{paddingLeft: 12}}
          value={this.props.initialText}
          onChange={this.handleTextChanged} />
      </div>
    );
  }
}

class Paper extends React.Component {
  render() {
    // Thin wrapper kept for any legacy usage; render as PaperCard
    var paper = {
      id: this.props.id,
      title: this.props.title,
      authors: this.props.authors || [],
      venue: this.props.venue,
      year: this.props.year,
      awards: this.props.awards || [],
      tags: this.props.tags || "",
      pdf: this.props.pdf,
      html_paper_url: this.props.html_paper_url,
      summary: this.props.summary,
      slides: this.props.slides,
      video_url: this.props.video_url
    };
    return <PaperCard paper={paper} thumbnail={this.props.thumbnail} assets={this.props.assets || {}} />;
  }
}

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
      success: function(data) { window.location.href = "/"; }.bind(this),
      error: function(xhr, status, err) { console.error(this.props.url, status, err.toString()); }.bind(this)
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
    var authorsValue = this.state.authors.map(function(a) { return a.name; }).join(", ");
    var awardsValue = this.state.awards.map(function(a) { return a.body; }).join(", ");

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
        <InputField name="Downloads" type="number" value={this.state.downloads} ref="downloads" />
        <SubmitButton/>
      </form>
    );
  }
}
