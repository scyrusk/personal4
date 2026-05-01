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
        <button className="paper-media-item cite-trigger" onClick={this._toggle}
          aria-label="Copy citation" aria-expanded={String(open)} aria-haspopup="true">
          <svg className="paper-cite-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />
            <path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />
          </svg>
          <span className="paper-media-label">{copied ? '✓ copied' : 'cite'}</span>
        </button>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {copied ? 'Citation copied in ' + copied.toUpperCase() + ' format' : ''}
        </div>
        {open && (
          <div className="cite-dropdown" role="menu">
            <button className="cite-option" role="menuitem" onClick={function(e) { self._copy('apa', e); }}>APA</button>
            <button className="cite-option" role="menuitem" onClick={function(e) { self._copy('mla', e); }}>MLA</button>
            <button className="cite-option" role="menuitem" onClick={function(e) { self._copy('bibtex', e); }}>BibTeX</button>
          </div>
        )}
      </div>
    );
  }
}

function randomString(n) {
  var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.apply(null, Array(n)).map(function() {
    return s.charAt(Math.floor(Math.random() * s.length));
  }).join('');
}

// ── FILTER HELPERS ──────────────────────────────────────
var FILTER_MAP = {
  "Award-winning": function(p) { return p.awards && p.awards.length > 0; },
  "Featured": function(p) { return computeFeaturedScore(p) > 0; }
};
var MOST_DOWNLOADED_FILTER = "Most downloaded";
var FEATURED_FILTER = "Featured";

function getTopTags(papers, n) {
  var counts = {};
  papers.forEach(function(p) {
    if (!p.tags) return;
    p.tags.split(";").forEach(function(t) {
      var tag = t.trim();
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; }).slice(0, n);
}

function paperMatchesFilter(paper, activeFilter) {
  if (!activeFilter) return true;
  if (activeFilter === MOST_DOWNLOADED_FILTER) return true;
  if (FILTER_MAP[activeFilter]) return FILTER_MAP[activeFilter](paper);
  // Tag-based filter (case-insensitive)
  var needle = activeFilter.toLowerCase();
  var tags = (paper.tags || "").split(";").map(function(t) { return t.trim().toLowerCase(); });
  return tags.indexOf(needle) >= 0;
}

function parseDownloads(downloads) {
  var parsed = parseInt(downloads, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function computeFeaturedScore(paper) {
  var awardsWeight = (paper.awards || []).length * 8;
  var downloadsWeight = Math.min(parseDownloads(paper.downloads), 500) / 80;
  var recencyWeight = Math.max(0, (paper.year || 0) - 2019) * 0.7;
  var resourceCount = [paper.project_page_url, paper.video_url, paper.presentation_url, paper.slides, paper.tweets].filter(Boolean).length;
  var resourceWeight = resourceCount * 0.9;
  return awardsWeight + downloadsWeight + recencyWeight + resourceWeight;
}

function getFeaturedPapers(papers, maxCount) {
  return papers.slice().sort(function(a, b) {
    var diff = computeFeaturedScore(b) - computeFeaturedScore(a);
    if (diff !== 0) return diff;
    if (b.year !== a.year) return b.year - a.year;
    return b.id - a.id;
  }).slice(0, maxCount);
}

function sortByDownloadsThenRecency(a, b) {
  var downloadDiff = parseDownloads(b.downloads) - parseDownloads(a.downloads);
  if (downloadDiff !== 0) return downloadDiff;
  if (b.year !== a.year) return b.year - a.year;
  return b.id - a.id;
}

function getVisiblePapers(papers, query, activeFilter) {
  var base = papers.filter(function(paper) {
    var matchQ = paperMatchesQuery(paper, query);
    var matchF = paperMatchesFilter(paper, activeFilter);
    return matchQ && matchF;
  });

  if (activeFilter === MOST_DOWNLOADED_FILTER) {
    return base.slice().sort(sortByDownloadsThenRecency).slice(0, 10);
  }

  return base.slice().sort(function(a, b) {
    return b.year !== a.year ? b.year - a.year : b.id - a.id;
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paperMatchesQuery(paper, ft) {
  if (ft === "") return true;
  var q = ft.toLowerCase();
  var re = new RegExp(escapeRegExp(q), 'i');
  return (
    re.test(paper.title) ||
    re.test(paper.venue) ||
    paper.year.toString().indexOf(q) >= 0 ||
    paper.authors.some(function(a) { return re.test(a.name); }) ||
    paper.awards.some(function(a) { return re.test(a.body); }) ||
    re.test(paper.tags || "")
  );
}

// ── PAPER CONTAINER ──────────────────────────────────────
class PaperContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], visibleCount: 50 };
    this.loadPapersFromServer = this.loadPapersFromServer.bind(this);
    this.handleShowMore = this.handleShowMore.bind(this);
  }

  loadPapersFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var reversed = data.reverse();
        this.setState({ data: reversed });
        if (this.props.onTopTags) this.props.onTopTags(getTopTags(reversed, 5));
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
        if (this.props.onTopTags) this.props.onTopTags(getTopTags(this.state.data, 5));
      }
    }
    if (prevProps.query !== this.props.query || prevProps.activeFilter !== this.props.activeFilter) {
      this.setState({ visibleCount: 50 });
    }
  }

  getFilteredCount() {
    var query = (this.props.query || "").toLowerCase().trim();
    var activeFilter = this.props.activeFilter;
    return getVisiblePapers(this.state.data, query, activeFilter).length;
  }

  handleShowMore() {
    this.setState(function(prev) {
      return { visibleCount: prev.visibleCount + 50 };
    });
  }

  render() {
    return (
      <PaperList
        data={this.state.data}
        assets={this.props.assets}
        query={this.props.query || ""}
        activeFilter={this.props.activeFilter || null}
        visibleCount={this.state.visibleCount}
        onShowMore={this.handleShowMore}
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
    var visibleCount = this.props.visibleCount || 50;

    // Filter and sort papers based on active mode
    var filtered = getVisiblePapers(this.props.data, query, activeFilter);
    var featured = getFeaturedPapers(filtered, 8);
    var shouldShowFeatured = false;
    var renderedCount = Math.min(filtered.length, visibleCount);
    var paged = filtered.slice(0, renderedCount);
    var hasMore = filtered.length > renderedCount;

    if (activeFilter === MOST_DOWNLOADED_FILTER) {
      return (
        <div className="paper-list">
          {paged.map(function(paper) {
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
          {hasMore && (
            <div className="papers-load-more-wrap">
              <button className="papers-load-more" onClick={this.props.onShowMore}>Render 50 more</button>
            </div>
          )}
        </div>
      );
    }

    // Group by year
    var byYear = {};
    paged.forEach(function(paper) {
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
        {shouldShowFeatured && (
          <div className="featured-papers">
            <div className="featured-papers-head">Selected Publications · Start Here</div>
            {featured.map(function(paper) {
              var thumb = paper.thumbnail || noThumb;
              return (
                <PaperCard
                  key={'featured-' + paper.id}
                  paper={paper}
                  thumbnail={thumb}
                  assets={assets}
                  featured={true}
                />
              );
            })}
          </div>
        )}
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
        {hasMore && (
          <div className="papers-load-more-wrap">
            <button className="papers-load-more" onClick={this.props.onShowMore}>Render 50 more</button>
          </div>
        )}
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
      copiedFormat: null,
      flipped: false,
      moreOpen: false
    };
    this.citeWrapRef = React.createRef();
    this.moreWrapRef = React.createRef();
    this.handleCiteToggle = this.handleCiteToggle.bind(this);
    this.handleCopyFormat = this.handleCopyFormat.bind(this);
    this.handleDocClick = this.handleDocClick.bind(this);
    this.handleCardClick = this.handleCardClick.bind(this);
    this.handleMoreToggle = this.handleMoreToggle.bind(this);
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
    if (this.moreWrapRef.current && !this.moreWrapRef.current.contains(e.target)) {
      if (this.state.moreOpen) this.setState({ moreOpen: false });
    }
  }

  handleCiteToggle(e) {
    e.stopPropagation();
    this.setState(function(prev) {
      return { citeOpen: !prev.citeOpen, copiedFormat: null, moreOpen: false };
    });
  }

  handleMoreToggle(e) {
    e.stopPropagation();
    this.setState(function(prev) {
      return { moreOpen: !prev.moreOpen, citeOpen: false };
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

  isInteractiveTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      'a, button, input, textarea, select, label, [role="button"], [role="menuitem"], .pub-author-link, .pub-venue-link, .pub-tag, .pub-tag-more, .cite-dropdown, .pub-more-menu'
    );
  }

  handleCardClick(e) {
    if (!this.props.paper.summary) return;
    if (this.isInteractiveTarget(e.target)) return;
    this.setState(function(prev) {
      return { flipped: !prev.flipped, citeOpen: false };
    });
  }

  setFilter(value) {
    window.dispatchEvent(new CustomEvent('setSearchFilter', { detail: { value: value } }));
    gaSendEvent('Interaction', 'Search', value);
  }

  renderMoreAction(href, label, iconPath, eventLabel) {
    return (
      <a className="pub-more-item" href={href} target="_blank" rel="noopener noreferrer" onClick={eventLabel ? function() { gaSendEvent('Publications', eventLabel, this.props.paper.id); }.bind(this) : null}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d={iconPath} /></svg>
        {label}
      </a>
    );
  }

  render() {
    var paper = this.props.paper;
    var tagsExpanded = this.state.tagsExpanded;
    var citeOpen = this.state.citeOpen;
    var copiedFormat = this.state.copiedFormat;
    var flipped = this.state.flipped;
    var moreOpen = this.state.moreOpen;
    var MAX_TAGS = 3;
    var isFlippable = !!paper.summary;

    var authors = paper.authors;
    var displayAuthors = authors.slice();

    // Tags: split from semicolon string
    var allTags = paper.tags ? paper.tags.split(";").map(function(t) { return t.trim(); }).filter(Boolean) : [];
    var visibleTags = tagsExpanded ? allTags : allTags.slice(0, MAX_TAGS);
    var hiddenCount = allTags.length - MAX_TAGS;

    var allAwards = paper.awards && paper.awards.length > 0 ? paper.awards : [];

    // PDF link
    var pdfLink = paper.html_paper_url || ("/papers/" + paper.id + "/serve");
    var hasPDF = paper.pdf || paper.html_paper_url;

    // Summary link (tweet thread)
    var summaryLink = paper.tweets;
    var hasSecondaryActions = !!(paper.project_page_url || summaryLink || paper.slides || paper.video_url || paper.presentation_url);

    return (
      <div className={
        'pub-card' +
        (flipped ? ' is-flipped' : '') +
        (isFlippable ? ' is-flippable' : '') +
        (this.props.featured ? ' is-featured' : '') +
        ((moreOpen || citeOpen) ? ' has-overlay-open' : '')
      } onClick={this.handleCardClick}>
        <div className="pub-card-flipper">

        {/* Back face — one-sentence takeaway */}
        <div className="pub-card-face pub-card-back">
          <div className="pub-takeaway-back">
            <button className="pub-back-close" onClick={() => this.setState({ flipped: false })}>↺ back</button>
            <div className="pub-takeaway-text">{paper.summary}</div>
            <div className="pub-takeaway-title">{paper.title}</div>
          </div>
        </div>

        {/* Front face */}
        <div className="pub-card-face pub-card-front">
        {this.props.featured && (
          <div className="pub-featured-badge">Featured</div>
        )}
        {isFlippable && (
          <div className="pub-flip-cue" aria-hidden="true">↺ takeaway</div>
        )}
        <div className="pub-card-inner">
          <div className="pub-thumb">
            {this.props.thumbnail ? (
              <img src={this.props.thumbnail} alt="" loading="lazy" decoding="async" />
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
            {allAwards.map(function(award) {
              return (
                <div key={award.id || award.body} className="pub-award">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                    <path d="M5.5 1l1.18 2.4 2.65.38-1.92 1.87.45 2.64L5.5 7.1 3.14 8.29l.45-2.64L1.67 3.78l2.65-.38z"/>
                  </svg>
                  {award.body}
                </div>
              );
            })}

            <a
              className="pub-title"
              href={hasPDF ? pdfLink : "#"}
              target={hasPDF ? "_blank" : undefined}
              onClick={hasPDF ? function(e) { gaSendEvent('Publications', 'PDFDownload', paper.id); } : function(e) { e.preventDefault(); }}
            >
              {paper.title}
            </a>

            <div className="pub-authors">
              {displayAuthors.map(function(author, i) {
                var name = author.name;
                var isSelf = author.self;
                var isPlaceholder = author.placeholder;
                return (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    {isPlaceholder ? (
                      <span style={{color: 'var(--text-muted)'}}>{name}</span>
                    ) : isSelf ? (
                      <strong>{name}</strong>
                    ) : (
                      <button
                        type="button"
                        className="pub-author-link"
                        onClick={() => this.setFilter(name)}
                        title={"Filter by " + name}
                        aria-label={"Filter by author " + name}
                      >{name}</button>
                    )}
                  </span>
                );
              }.bind(this))}
            </div>

            <div className="pub-venue">
              <button
                type="button"
                className="pub-venue-link"
                onClick={() => this.setFilter(paper.venue)}
                title={"Filter by venue"}
                aria-label={"Filter by venue " + paper.venue}
              >{paper.venue}</button>
              {' · '}
              <button
                type="button"
                className="pub-venue-link"
                onClick={() => this.setFilter(paper.year.toString())}
                title={"Filter by year"}
                aria-label={"Filter by year " + paper.year}
              >{paper.year}</button>
            </div>

            {allTags.length > 0 && (
              <div className="pub-tags">
                {visibleTags.map(function(tag) {
                  return (
                    <button
                      type="button"
                      key={tag}
                      className="pub-tag"
                      onClick={() => this.setFilter(tag)}
                      title={"Filter by tag: " + tag}
                      aria-label={"Filter by tag " + tag}
                    >{tag}</button>
                  );
                }.bind(this))}
                {!tagsExpanded && hiddenCount > 0 && (
                  <button
                    type="button"
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

              <div className="cite-wrapper" ref={this.citeWrapRef}>
                <button
                  type="button"
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
                              type="button"
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
              {hasSecondaryActions && (
                <div className="pub-more-wrap" ref={this.moreWrapRef}>
                  <button
                    type="button"
                    className={'pub-action-secondary pub-action-more' + (moreOpen ? ' cite-active' : '')}
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    aria-label={"More resources for " + paper.title}
                    onClick={this.handleMoreToggle}
                  >
                    More {moreOpen ? '▲' : '▾'}
                  </button>
                  {moreOpen && (
                    <div className="pub-more-menu" role="menu" aria-label="Additional resources">
                      {paper.project_page_url && this.renderMoreAction(
                        paper.project_page_url,
                        'Project page',
                        'M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v9a1.5 1.5 0 0 1-1.5 1.5H9v1h1.5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1H7v-1H2.5A1.5 1.5 0 0 1 1 11.5v-9zM2.5 2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-11z'
                      )}
                      {summaryLink && this.renderMoreAction(
                        summaryLink,
                        'Summary thread',
                        'M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3.5l2.5 3 2.5-3H14a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z'
                      )}
                      {paper.slides && this.renderMoreAction(
                        paper.slides,
                        'Slides',
                        'M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9v1h1.5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1H7v-1H2a1 1 0 0 1-1-1V3zm13 0H2v8h12V3zM4 6h8v1H4V6zm0 2.5h5v1H4v-1z',
                        'SlidesDownload'
                      )}
                      {paper.video_url && this.renderMoreAction(
                        paper.video_url,
                        'Video',
                        'M3 2.5v11l10-5.5L3 2.5z'
                      )}
                      {paper.presentation_url && this.renderMoreAction(
                        paper.presentation_url,
                        'Talk',
                        'M6 1a1 1 0 0 0-1 1v1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.5l-1 2h-1a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-1l-1-2H13a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-3V2a1 1 0 0 0-1-1H6zm0 1h4v1H6V2zm-4 2h12v6H2V4z'
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>{/* pub-card-front */}

        </div>{/* pub-card-flipper */}
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
      doi: this.props.doi,
      bibtex: this.props.bibtex,
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
    var p = props.paper || {};
    this.state = {
      title:            p.title || '',
      venue:            p.venue || '',
      selfOrder:        p.selfOrder != null ? String(p.selfOrder) : '',
      year:             p.year != null ? String(p.year) : '',
      authors:          (p.authors || []).map(function(a) { return a.name; }).join(', '),
      awards:           (p.awards || []).map(function(a) { return a.body; }).join(', '),
      type:             p.type != null ? p.type : '',
      thumbnail:        null,
      pdf:              null,
      downloads:        p.downloads != null ? String(p.downloads) : '',
      slides:           null,
      html_slides_url:  p.html_slides_url || '',
      html_paper_url:   p.html_paper_url || '',
      doi:              p.doi || '',
      bibtex:           p.bibtex || '',
      presentation_url: p.presentation_url || '',
      project_page_url: p.project_page_url || '',
      video_url:        p.video_url || '',
      summary:          p.summary || '',
      tweets:           p.tweets || '',
      tags:             p.tags || ''
    };
    this._handleSubmit = this._handleSubmit.bind(this);
    this._set = this._set.bind(this);
  }

  _set(field) {
    var self = this;
    return function(value) {
      var update = {};
      update[field] = value;
      self.setState(update);
    };
  }

  _handleSubmit(e) {
    e.preventDefault();
    var s = this.state;
    var paper = {
      paper: {
        title:            s.title,
        venue:            s.venue,
        year:             s.year,
        self_order:       s.selfOrder,
        authors:          s.authors,
        awards:           s.awards,
        backing_type:     s.type,
        thumbnail:        s.thumbnail,
        pdf:              s.pdf,
        downloads:        s.downloads,
        slides:           s.slides,
        html_slides_url:  s.html_slides_url,
        html_paper_url:   s.html_paper_url,
        doi:              s.doi,
        bibtex:           s.bibtex,
        presentation_url: s.presentation_url,
        project_page_url: s.project_page_url,
        video_url:        s.video_url,
        summary:          s.summary,
        tweets:           s.tweets,
        tags:             s.tags
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
    var s = this.state;
    return (
      <form className="paper-form form-horizontal" onSubmit={this._handleSubmit} encType="multipart/form-data">
        <InputField name="Title"         type="text"   value={s.title}            onChange={this._set('title')} />
        <InputField name="Venue"         type="text"   value={s.venue}            onChange={this._set('venue')} />
        <InputField name="Self Order"    type="number" value={s.selfOrder}        onChange={this._set('selfOrder')} />
        <InputField name="Year"          type="number" value={s.year}             onChange={this._set('year')} />
        <InputField name="Authors"       type="text"   value={s.authors}          onChange={this._set('authors')} />
        <InputField name="Awards"        type="text"   value={s.awards}           onChange={this._set('awards')} />
        <SelectField name="Type" options={this._paperTypeOptions()} value={s.type} onChange={this._set('type')} />
        <FileField name="Thumbnail" onChange={this._set('thumbnail')} />
        <FileField name="PDF"       onChange={this._set('pdf')} />
        <FileField name="Slides"    onChange={this._set('slides')} />
        <InputField name="HTML Slides"     type="text" value={s.html_slides_url}  onChange={this._set('html_slides_url')} />
        <InputField name="HTML Paper"      type="text" value={s.html_paper_url}   onChange={this._set('html_paper_url')} />
        <InputField name="DOI"             type="text" value={s.doi}              onChange={this._set('doi')} />
        <InputField name="BibTeX"          type="text" value={s.bibtex}           onChange={this._set('bibtex')} />
        <InputField name="Presentation URL" type="text" value={s.presentation_url} onChange={this._set('presentation_url')} />
        <InputField name="Project Page URL" type="text" value={s.project_page_url} onChange={this._set('project_page_url')} />
        <InputField name="Video URL"       type="text" value={s.video_url}        onChange={this._set('video_url')} />
        <InputField name="Tweet URL"       type="text" value={s.tweets}           onChange={this._set('tweets')} />
        <InputField name="Tags"            type="text" value={s.tags}             onChange={this._set('tags')} />
        <InputField name="Summary"         type="text" value={s.summary}          onChange={this._set('summary')} />
        <InputField name="Downloads"       type="number" value={s.downloads}      onChange={this._set('downloads')} />
        <SubmitButton/>
      </form>
    );
  }
}
