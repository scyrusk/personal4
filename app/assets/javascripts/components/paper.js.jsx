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

function formatDownloadCount(n) {
  var d = parseDownloads(n);
  if (!d) return null;
  if (d >= 1000) return (d / 1000).toFixed(d >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(d);
}

function randomString(n) {
  var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.apply(null, Array(n)).map(function() {
    return s.charAt(Math.floor(Math.random() * s.length));
  }).join('');
}

// ── FILTER HELPERS ──────────────────────────────────────
// SF-13: query (q), tag, sort, and year are independent, composable filters.
var AWARD_TAG = "Award-winning";

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

function getTagCounts(papers) {
  var counts = {};
  papers.forEach(function(p) {
    if (!p.tags) return;
    p.tags.split(";").forEach(function(t) {
      var tag = t.trim();
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}

function paperMatchesTag(paper, tag) {
  if (!tag) return true;
  if (tag === AWARD_TAG) return paper.awards && paper.awards.length > 0;
  var needle = tag.toLowerCase();
  var tags = (paper.tags || "").split(";").map(function(t) { return t.trim().toLowerCase(); });
  return tags.indexOf(needle) >= 0;
}

function parseDownloads(downloads) {
  var parsed = parseInt(downloads, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// "Featured" is a manually-set flag on each paper (Paper#featured), not a computed score.
function getFeaturedPapers(papers, maxCount) {
  var featured = papers.filter(function(p) { return !!p.featured; });
  featured.sort(function(a, b) {
    if (b.year !== a.year) return b.year - a.year;
    return b.id - a.id;
  });
  return maxCount ? featured.slice(0, maxCount) : featured;
}

function sortByDownloadsThenRecency(a, b) {
  var downloadDiff = parseDownloads(b.downloads) - parseDownloads(a.downloads);
  if (downloadDiff !== 0) return downloadDiff;
  if (b.year !== a.year) return b.year - a.year;
  return b.id - a.id;
}

function getVisiblePapers(papers, query, tag, sort, year) {
  var base = papers.filter(function(paper) {
    return paperMatchesQuery(paper, query) &&
           paperMatchesTag(paper, tag) &&
           (!year || paper.year === year);
  });

  // "Most downloaded" keeps its focused top-10 view (composed with any filters)
  if (sort === 'downloads') {
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
    // SF-04: loading renders text-first skeleton cards, never a false empty state
    this.state = { data: [], visibleCount: props.pageSize || 25, loading: true, loadError: false };
    this.loadPapersFromServer = this.loadPapersFromServer.bind(this);
    this.handleShowMore = this.handleShowMore.bind(this);
    this.handleRetry = this.handleRetry.bind(this);
  }

  loadPapersFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var reversed = data.reverse();
        this.setState({ data: reversed, loading: false, loadError: false });
        if (this.props.onTopTags) this.props.onTopTags(getTopTags(reversed, 5));
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({ loading: false, loadError: true });
      }.bind(this)
    });
  }

  componentDidMount() {
    this.loadPapersFromServer();
    // Jump-to-year needs the whole list in the DOM before it can scroll to a year
    this._renderAllHandler = function() {
      this._renderAllRequested = true;
      this.setState({ visibleCount: Number.MAX_SAFE_INTEGER });
    }.bind(this);
    window.addEventListener('pubsRenderAll', this._renderAllHandler);
  }

  componentWillUnmount() {
    if (this._renderAllHandler) window.removeEventListener('pubsRenderAll', this._renderAllHandler);
  }

  handleRetry() {
    this.setState({ loading: true, loadError: false }, this.loadPapersFromServer);
  }

  componentDidUpdate(prevProps, prevState) {
    var filtersChanged = prevProps.query !== this.props.query ||
                         prevProps.activeTag !== this.props.activeTag ||
                         prevProps.sort !== this.props.sort ||
                         prevProps.year !== this.props.year;
    var pagingChanged = prevProps.page !== this.props.page ||
                        prevProps.showAll !== this.props.showAll;
    var changed = filtersChanged || pagingChanged ||
                  prevState.data !== this.state.data ||
                  prevState.visibleCount !== this.state.visibleCount;
    if (changed) this.reportCounts();
    if (prevState.data !== this.state.data) {
      if (this.props.onTopTags) this.props.onTopTags(getTopTags(this.state.data, 5));
      if (this.props.onAllTags) this.props.onAllTags(getTopTags(this.state.data, 1000));
      if (this.props.onYears) {
        var yearsSet = {};
        this.state.data.forEach(function(p) { yearsSet[p.year] = true; });
        this.props.onYears(Object.keys(yearsSet).sort(function(a, b) { return b - a; }));
      }
    }
    // SF-18: the single-page view renders incrementally — restart the window
    // whenever the underlying list changes or the view is re-entered (unless a
    // jump-to-year just asked for the whole list).
    if (filtersChanged || prevProps.showAll !== this.props.showAll) {
      if (this._renderAllRequested) {
        this._renderAllRequested = false;
      } else {
        this.setState({ visibleCount: this.props.pageSize || 25 });
      }
    }
  }

  pageSize() {
    return this.props.pageSize || 25;
  }

  // Clamp so an out-of-range ?page= URL lands on the last real page
  currentPage(filteredTotal) {
    var totalPages = Math.max(1, Math.ceil(filteredTotal / this.pageSize()));
    return Math.min(Math.max(1, this.props.page || 1), totalPages);
  }

  reportCounts() {
    var data = this.state.data;
    var query = (this.props.query || "").toLowerCase().trim();

    // Result range reflects the current query/filters.
    var filteredTotal = getVisiblePapers(data, query, this.props.activeTag, this.props.sort, this.props.year).length;
    var start, rendered;
    if (this.props.showAll) {
      start = 1;
      rendered = Math.min(filteredTotal, this.state.visibleCount);
    } else {
      var page = this.currentPage(filteredTotal);
      start = (page - 1) * this.pageSize() + 1;
      rendered = Math.max(0, Math.min(filteredTotal - (start - 1), this.pageSize()));
      if (filteredTotal === 0) start = 1;
    }
    if (this.props.onResultCount) this.props.onResultCount({ start: start, rendered: rendered, total: filteredTotal });

    // Chip counts are category totals (query-independent) so they stay stable while typing.
    if (this.props.onChipCounts) {
      var counts = getTagCounts(data);
      counts['All'] = data.length;
      counts[AWARD_TAG] = getVisiblePapers(data, '', AWARD_TAG, 'newest', null).length;
      counts['Most downloaded'] = getVisiblePapers(data, '', null, 'downloads', null).length;
      this.props.onChipCounts(counts);
    }
  }

  handleShowMore() {
    var step = this.pageSize();
    this.setState(function(prev) {
      return { visibleCount: prev.visibleCount + step };
    });
  }

  render() {
    return (
      <PaperList
        data={this.state.data}
        assets={this.props.assets}
        query={this.props.query || ""}
        activeTag={this.props.activeTag || null}
        sort={this.props.sort || 'newest'}
        year={this.props.year || null}
        loading={this.state.loading}
        loadError={this.state.loadError}
        onRetry={this.handleRetry}
        onResetFilters={this.props.onResetFilters}
        onTagToggle={this.props.onTagToggle}
        onYearChange={this.props.onYearChange}
        page={this.props.page || 1}
        showAll={!!this.props.showAll}
        pageSize={this.pageSize()}
        onPageChange={this.props.onPageChange}
        onShowAllToggle={this.props.onShowAllToggle}
        visibleCount={this.state.visibleCount}
        onShowMore={this.handleShowMore}
      />
    );
  }
}

// ── PAPER LIST ────────────────────────────────────────────
function isBestPaper(paper) {
  if (!paper.awards) return false;
  return paper.awards.some(function(a) {
    var b = (a.body || '').toLowerCase();
    return b.indexOf('best paper') >= 0 && b.indexOf('honorable') < 0 && b.indexOf('nominee') < 0;
  });
}

class PaperList extends React.Component {
  constructor(props) {
    super(props);
    this.sentinelRef = React.createRef();
    this._io = null;
    this._observed = null;
    this.setupObserver = this.setupObserver.bind(this);
  }

  // Real hrefs so page links still work as plain anchors without JS (SF-01)
  pageHref(p) {
    try {
      var params = new URLSearchParams(window.location.search);
      if (p > 1) params.set('page', String(p));
      else params.delete('page');
      params.delete('view');
      var q = params.toString();
      return window.location.pathname + (q ? '?' + q : '');
    } catch (_) {
      return '?page=' + p;
    }
  }

  componentDidMount() { this.setupObserver(); }
  componentDidUpdate() { this.setupObserver(); }
  componentWillUnmount() {
    if (this._io) { this._io.disconnect(); this._io = null; }
    this._observed = null;
  }

  // IntersectionObserver auto-load (manual button stays as fallback)
  setupObserver() {
    if (typeof IntersectionObserver === 'undefined') return;
    var node = this.sentinelRef.current;
    if (!node) {
      if (this._io) this._io.disconnect();
      this._observed = null;
      return;
    }
    if (this._observed === node) return;
    var self = this;
    if (!this._io) {
      this._io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting && self.props.onShowMore) self.props.onShowMore();
        });
      }, { rootMargin: '300px 0px' });
    } else {
      this._io.disconnect();
    }
    this._io.observe(node);
    this._observed = node;
  }

  // SF-12: compact "Selected publications" entry-point card
  renderSelectedCard(paper) {
    var pdfLink = paper.html_paper_url || ("/papers/" + paper.id + "/serve");
    var hasPDF = paper.pdf || paper.html_paper_url;
    var abbrevMatch = (paper.venue || '').match(/\(([^)]+)\)/);
    var pill = paper.awards && paper.awards.length > 0
      ? paper.awards[0].body
      : ((abbrevMatch ? abbrevMatch[1] : paper.venue) + ' ' + paper.year);
    var count = formatDownloadCount(paper.downloads);
    var authorNames = (paper.authors || []).map(function(a) { return a.name; }).join(', ');
    return (
      <div key={'sel-' + paper.id} className="sw-card">
        {paper.thumbnail && (
          <div className="sw-thumb">
            <img src={paper.thumbnail} alt="" loading="lazy" decoding="async" width="64" height="64" />
          </div>
        )}
        <div className="sw-card-body">
          <div className="sw-card-meta">
            <span className={'sw-badge' + (paper.awards && paper.awards.length > 0 ? '' : ' sw-badge-venue')}>{pill}</span>
            {count && (
              <span className="sw-count" aria-label={parseDownloads(paper.downloads) + ' downloads'}>↓ {count}</span>
            )}
          </div>
          <a
            className="sw-title"
            href={hasPDF ? pdfLink : "#"}
            target={hasPDF ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={hasPDF ? function() { gaSendEvent('Publications', 'PDFDownload', paper.id); } : function(e) { e.preventDefault(); }}
          >{paper.title}</a>
          {authorNames && <div className="sw-authors">{authorNames}</div>}
        </div>
      </div>
    );
  }

  renderSelectedModule(totalCount) {
    var sel = getFeaturedPapers(this.props.data, 2);
    if (sel.length === 0) return null;
    var self = this;
    return (
      <div className="selected-work" aria-label="Selected publications">
        <div className="selected-work-top">
          <div>
            <div className="selected-work-head">Selected publications</div>
            <div className="selected-work-sub">Start here instead of scanning all {totalCount} — award winners and recent highlights.</div>
          </div>
          <button
            type="button"
            className="selected-work-browse"
            onClick={function() {
              var el = document.querySelector('.year-group');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >Browse all {totalCount} →</button>
        </div>
        <div className="sw-cards">
          {sel.map(function(paper) { return self.renderSelectedCard(paper); })}
        </div>
      </div>
    );
  }

  // SF-04: skeleton cards while papers/thumbnails load — text-first, no false empty state
  renderSkeleton(caption) {
    return (
      <div className="pub-skeleton" role="status" aria-live="polite">
        <div className="pub-skeleton-card" aria-hidden="true">
          <div className="pub-skeleton-thumb"></div>
          <div className="pub-skeleton-lines">
            <div className="pub-skeleton-line w80"></div>
            <div className="pub-skeleton-line w60"></div>
            <div className="pub-skeleton-line w40"></div>
          </div>
        </div>
        <div className="pub-skeleton-caption">
          <span className="pub-skeleton-spinner" aria-hidden="true">⟳</span> {caption}
        </div>
      </div>
    );
  }

  // SF-08: first-class 0-results state — explain, show constraints, offer recovery
  renderEmptyState() {
    var self = this;
    var query = this.props.query || '';
    var tag = this.props.activeTag;
    var year = this.props.year;
    var constraints = [];
    if (tag) constraints.push({ label: tag, remove: function() { if (self.props.onTagToggle) self.props.onTagToggle(tag); } });
    if (year) constraints.push({ label: String(year), remove: function() { if (self.props.onYearChange) self.props.onYearChange(null); } });
    if (query) constraints.push({ label: '“' + query + '”', remove: function() {
      window.dispatchEvent(new CustomEvent('setSearchFilter', { detail: { value: '' } }));
    } });

    var title = constraints.length >= 2 ? 'No papers match both filters' : 'No papers match your search';
    var names = constraints.map(function(c) { return c.label; });
    var explanation;
    if (constraints.length >= 2) {
      explanation = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] +
        ' are both on. Turn one off, or start again from all ' + this.props.data.length + ' papers.';
    } else if (constraints.length === 1) {
      explanation = names[0] + ' matches nothing. Start again from all ' + this.props.data.length + ' papers.';
    } else {
      explanation = 'Start again from all ' + this.props.data.length + ' papers.';
    }

    // Fallback: drop the narrowest constraint and surface the closest matches
    var fallback = [];
    var fallbackLabel = null;
    if (constraints.length >= 1) {
      if (year) {
        fallback = getVisiblePapers(this.props.data, query.toLowerCase().trim(), tag, 'newest', null);
        fallbackLabel = tag ? tag.toLowerCase() : null;
      } else if (query && tag) {
        fallback = getVisiblePapers(this.props.data, '', tag, 'newest', null);
        fallbackLabel = tag.toLowerCase();
      } else if (tag) {
        fallback = [];
      } else if (query) {
        fallback = [];
      }
    }
    var assets = this.props.assets;

    return (
      <div className="paper-list">
        <div className="pubs-empty">
          <svg className="pubs-empty-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
          <div className="pubs-empty-title">{title}</div>
          <p className="pubs-empty-body">{explanation}</p>
          <div className="pubs-empty-actions">
            <button type="button" className="pubs-empty-clear" onClick={this.props.onResetFilters}>
              <span aria-hidden="true">↺</span> Clear filters
            </button>
            {constraints.map(function(c) {
              return (
                <button type="button" key={c.label} className="pubs-empty-remove" onClick={c.remove}>
                  <span aria-hidden="true">×</span> Remove {c.label} only
                </button>
              );
            })}
          </div>
        </div>
        {fallback.length > 0 && (
          <div className="pubs-empty-fallback">
            <div className="pubs-empty-fallback-head">
              <span>Closest {fallbackLabel ? fallbackLabel + ' ' : ''}papers</span>
              <span className="pubs-empty-fallback-count">{fallback.length}</span>
            </div>
            {fallback.slice(0, 3).map(function(paper) {
              return <PaperCard key={paper.id} paper={paper} thumbnail={paper.thumbnail || null} assets={assets} />;
            })}
          </div>
        )}
      </div>
    );
  }

  // SF-01/SF-32: unmissable boundary — names the exact range that just ended
  renderEndMarker(text) {
    return (
      <div className="papers-end-marker" role="separator" aria-label={text}>
        <span className="papers-end-line" aria-hidden="true"></span>
        <span className="papers-end-text">{text}</span>
        <span className="papers-end-line" aria-hidden="true"></span>
      </div>
    );
  }

  renderPageButton(p, current) {
    var self = this;
    return (
      <a
        key={p}
        href={this.pageHref(p)}
        className={'papers-page-num' + (p === current ? ' active' : '')}
        aria-label={'Page ' + p}
        aria-current={p === current ? 'page' : undefined}
        onClick={function(e) {
          e.preventDefault();
          if (p !== current && self.props.onPageChange) self.props.onPageChange(p);
        }}
      >{p}</a>
    );
  }

  // SF-01: explicit pagination block after the last card on the page
  renderPagination(page, totalPages, start, end, total) {
    var self = this;
    var nums = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push('…');
      for (var j = Math.max(2, page - 1); j <= Math.min(totalPages - 1, page + 1); j++) nums.push(j);
      if (page < totalPages - 2) nums.push('…');
      nums.push(totalPages);
    }
    var pct = total > 0 ? Math.round((end / total) * 100) : 0;
    return (
      <nav className="papers-pagination" aria-label="Publications pages">
        <div className="papers-pagination-row">
          <a
            href={page > 1 ? this.pageHref(page - 1) : undefined}
            className={'papers-page-btn papers-page-prev' + (page <= 1 ? ' disabled' : '')}
            aria-disabled={page <= 1}
            onClick={function(e) {
              e.preventDefault();
              if (page > 1 && self.props.onPageChange) self.props.onPageChange(page - 1);
            }}
          ><span aria-hidden="true">‹</span> Previous</a>
          <div className="papers-page-nums">
            {nums.map(function(n, idx) {
              return n === '…'
                ? <span key={'gap' + idx} className="papers-page-gap" aria-hidden="true">…</span>
                : self.renderPageButton(n, page);
            })}
          </div>
          <a
            href={page < totalPages ? this.pageHref(page + 1) : undefined}
            className={'papers-page-btn papers-page-next' + (page >= totalPages ? ' disabled' : '')}
            aria-disabled={page >= totalPages}
            onClick={function(e) {
              e.preventDefault();
              if (page < totalPages && self.props.onPageChange) self.props.onPageChange(page + 1);
            }}
          >Next <span aria-hidden="true">›</span></a>
        </div>
        <div className="papers-pagination-meta">
          <span className="papers-pagination-status">Page {page} of {totalPages} · showing papers {start}–{end} of {total}</span>
          <button
            type="button"
            className="papers-show-all"
            onClick={function() { if (self.props.onShowAllToggle) self.props.onShowAllToggle(true); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {' '}Show all {total} on one page
          </button>
        </div>
        <div className="papers-progress-bar" aria-hidden="true"><div className="papers-progress-fill" style={{width: pct + '%'}}></div></div>
        <div className="papers-pagination-note">{total} papers · {this.props.pageSize} render at a time, images load as they scroll into view</div>
      </nav>
    );
  }

  // SF-18: single-page view renders incrementally; sentinel keeps loading as you scroll
  renderShowAllFooter(renderedCount, total) {
    var self = this;
    var hasMore = total > renderedCount;
    var pct = total > 0 ? Math.round((renderedCount / total) * 100) : 0;
    return (
      <div className="papers-load-more-wrap">
        {hasMore && this.renderSkeleton('More papers render as you scroll')}
        <div className="papers-progress">
          <div className="papers-progress-text" aria-live="polite">
            {hasMore
              ? 'Showing first ' + renderedCount + ' of ' + total + ' papers — more render as you scroll'
              : 'All ' + total + ' papers loaded · ' + this.props.pageSize + ' render at a time, images load as they scroll into view'}
          </div>
          <div className="papers-progress-bar"><div className="papers-progress-fill" style={{width: pct + '%'}}></div></div>
        </div>
        {hasMore && (
          <button type="button" className="papers-load-more" onClick={this.props.onShowMore}>
            <span aria-hidden="true">⌄</span> Load {Math.min(this.props.pageSize, total - renderedCount)} more papers
          </button>
        )}
        {!hasMore && this.renderEndMarker('End of list — all ' + total + ' papers shown')}
        <button
          type="button"
          className="papers-show-all papers-back-to-pages"
          onClick={function() { if (self.props.onShowAllToggle) self.props.onShowAllToggle(false); }}
        >Back to paged view</button>
        {hasMore && <div ref={this.sentinelRef} className="papers-sentinel" aria-hidden="true"></div>}
      </div>
    );
  }

  render() {
    var query = (this.props.query || "").toLowerCase().trim();
    var tag = this.props.activeTag;
    var sort = this.props.sort || 'newest';
    var yearFilter = this.props.year;
    var assets = this.props.assets;
    var visibleCount = this.props.visibleCount || 50;
    var self = this;

    // SF-04: initial fetch renders skeletons, and a failed fetch renders a retry
    // card — never the misleading "No papers match" state.
    if (this.props.loading) {
      return (
        <div className="paper-list">
          {this.renderSkeleton('Loading papers…')}
        </div>
      );
    }
    if (this.props.loadError) {
      return (
        <div className="paper-list">
          <div className="pubs-empty">
            <div className="pubs-empty-title">Couldn’t load publications</div>
            <p className="pubs-empty-body">Something went wrong fetching the paper database.</p>
            <div className="pubs-empty-actions">
              <button type="button" className="pubs-empty-clear" onClick={this.props.onRetry}>
                <span aria-hidden="true">↺</span> Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    var filtered = getVisiblePapers(this.props.data, query, tag, sort, yearFilter);
    var total = filtered.length;
    var pageSize = this.props.pageSize || 25;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, this.props.page || 1), totalPages);
    var showAll = this.props.showAll;

    if (total === 0 && this.props.data.length > 0) {
      return this.renderEmptyState();
    }

    var start, end, paged, footer;
    if (showAll) {
      var renderedCount = Math.min(total, visibleCount);
      start = 1;
      end = renderedCount;
      paged = filtered.slice(0, renderedCount);
      footer = this.renderShowAllFooter(renderedCount, total);
    } else {
      start = (page - 1) * pageSize + 1;
      end = Math.min(total, page * pageSize);
      paged = filtered.slice(start - 1, end);
      footer = (
        <div>
          {this.renderEndMarker(totalPages > 1
            ? 'End of page ' + page + ' — papers ' + start + '–' + end + ' of ' + total
            : 'End of list — all ' + total + ' papers shown')}
          {totalPages > 1 && this.renderPagination(page, totalPages, start, end, total)}
        </div>
      );
    }

    // SF-32: every rendered card carries its index in the current view
    var numById = {};
    paged.forEach(function(p, i) { numById[p.id] = start + i; });

    // SF-12: pristine view opens with the Selected publications module; the full
    // year-grouped catalog always renders below it.
    var pristine = !query && !tag && !yearFilter && sort === 'newest' && page === 1;

    // "Most downloaded" — flat top-10 list, no year groups
    if (sort === 'downloads') {
      return (
        <div className="paper-list">
          {paged.map(function(paper) {
            return (
              <PaperCard key={paper.id} paper={paper} num={numById[paper.id]} thumbnail={paper.thumbnail || null} assets={assets} />
            );
          })}
          {footer}
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

    return (
      <div className="paper-list">
        {pristine && this.renderSelectedModule(this.props.data.length)}
        {years.map(function(year) {
          return (
            <div key={year} id={'year-' + year} className="year-group">
              <div className="year-label">{year}</div>
              {byYear[year].map(function(paper) {
                return (
                  <PaperCard key={paper.id} paper={paper} num={numById[paper.id]} thumbnail={paper.thumbnail || null} assets={assets} />
                );
              })}
            </div>
          );
        })}
        {footer}
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

// SF-14: BibTeX must compile in any toolchain — transliterate to plain ASCII
// (smart quotes, dashes, accented characters) instead of emitting raw Unicode.
function toAsciiBibtex(str) {
  var s = String(str || '');
  if (s.normalize) s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013/g, '--')
    .replace(/\u2014/g, '---')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/\u00df/g, 'ss')
    .replace(/\u00e6/g, 'ae')
    .replace(/\u00f8/g, 'o')
    .replace(/\u0142/g, 'l');
  // Anything still outside printable ASCII gets dropped rather than shipped raw
  return s.replace(/[^\x20-\x7e\n]/g, '');
}

function bibtexKey(paper) {
  var names = paper.authors.map(function(a) { return a.name; });
  var firstLast = (names[0] || 'unknown').trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  var titleWord = (toAsciiBibtex(paper.title).match(/[A-Za-z]{3,}/) || ['paper'])[0].toLowerCase();
  return firstLast + paper.year + titleWord;
}

function buildBibTeX(paper) {
  var names = paper.authors.map(function(a) { return a.name; });
  return toAsciiBibtex(
    '@inproceedings{' + bibtexKey(paper) + ',\n' +
    '  author    = {' + names.join(' and ') + '},\n' +
    '  title     = {{' + paper.title + '}},\n' +
    '  booktitle = {' + paper.venue + '},\n' +
    '  year      = {' + paper.year + '}\n' +
    '}'
  );
}

function buildRIS(paper) {
  var lines = ['TY  - CONF'];
  paper.authors.forEach(function(a) {
    lines.push('AU  - ' + formatNameLastFirst(a.name));
  });
  lines.push('TI  - ' + paper.title);
  lines.push('T2  - ' + paper.venue);
  lines.push('PY  - ' + paper.year);
  if (paper.doi) lines.push('DO  - ' + paper.doi);
  lines.push('ER  - ');
  return lines.join('\n');
}

function scholarUrl(paper) {
  return 'https://scholar.google.com/scholar?q=' + encodeURIComponent('"' + paper.title + '"');
}

// ── PAPER CARD ────────────────────────────────────────────
class PaperCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tagsExpanded: false,
      citeOpen: false,
      citeFormat: 'BibTeX',
      copiedFormat: null,
      flipped: false,
      moreOpen: false,
      pdfOpening: false
    };
    this.citeWrapRef = React.createRef();
    this.citePanelRef = React.createRef();
    this.moreWrapRef = React.createRef();
    this.handleCiteToggle = this.handleCiteToggle.bind(this);
    this.handleCopyFormat = this.handleCopyFormat.bind(this);
    this.handleDocClick = this.handleDocClick.bind(this);
    this.handleDocKey = this.handleDocKey.bind(this);
    this.handleCardClick = this.handleCardClick.bind(this);
    this.handleMoreToggle = this.handleMoreToggle.bind(this);
    this.handlePdfClick = this.handlePdfClick.bind(this);
    this.handleDownloadBib = this.handleDownloadBib.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocClick);
    document.addEventListener('keydown', this.handleDocKey);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocClick);
    document.removeEventListener('keydown', this.handleDocKey);
    if (this._copyTimer) clearTimeout(this._copyTimer);
    if (this._pdfTimer) clearTimeout(this._pdfTimer);
  }

  handleDocClick(e) {
    var inCite = (this.citeWrapRef.current && this.citeWrapRef.current.contains(e.target)) ||
                 (this.citePanelRef.current && this.citePanelRef.current.contains(e.target));
    if (!inCite && this.state.citeOpen) this.setState({ citeOpen: false });
    if (this.moreWrapRef.current && !this.moreWrapRef.current.contains(e.target)) {
      if (this.state.moreOpen) this.setState({ moreOpen: false });
    }
  }

  // The cite panel closes on Esc (and says so in its header)
  handleDocKey(e) {
    if (e.key === 'Escape' && this.state.citeOpen) this.setState({ citeOpen: false });
  }

  handleCiteToggle(e, format) {
    e.stopPropagation();
    var fmt = typeof format === 'string' ? format : null;
    this.setState(function(prev) {
      return {
        citeOpen: fmt ? true : !prev.citeOpen,
        citeFormat: fmt || prev.citeFormat,
        copiedFormat: null,
        moreOpen: false
      };
    });
  }

  // SF-12: the tap acknowledges immediately, even though the PDF opens in a new tab
  handlePdfClick() {
    gaSendEvent('Publications', 'PDFDownload', this.props.paper.id);
    this.setState({ pdfOpening: true });
    if (this._pdfTimer) clearTimeout(this._pdfTimer);
    this._pdfTimer = setTimeout(function() {
      this.setState({ pdfOpening: false });
    }.bind(this), 2500);
  }

  getCitationText(fmt) {
    var paper = this.props.paper;
    if (fmt === 'APA') return buildAPA(paper);
    if (fmt === 'MLA') return buildMLA(paper);
    if (fmt === 'RIS') return buildRIS(paper);
    return buildBibTeX(paper);
  }

  // SF-14: optional .bib download alongside copy
  handleDownloadBib(e) {
    e.stopPropagation();
    var paper = this.props.paper;
    var blob = new Blob([buildBibTeX(paper) + '\n'], { type: 'application/x-bibtex' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = bibtexKey(paper) + '.bib';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
    gaSendEvent('Publications', 'DownloadBib', paper.id);
  }

  handleMoreToggle(e) {
    e.stopPropagation();
    this.setState(function(prev) {
      return { moreOpen: !prev.moreOpen, citeOpen: false };
    });
  }

  handleCopyFormat(fmt, e) {
    e.stopPropagation();
    var text = this.getCitationText(fmt);
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
      'a, button, input, textarea, select, label, [role="button"], [role="menuitem"], .pub-author-link, .pub-venue-link, .pub-tag, .pub-tag-more, .cite-dropdown, .cite-panel, .pub-more-menu'
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
    var citeFormat = this.state.citeFormat;
    var pdfOpening = this.state.pdfOpening;
    // SF-19: two tags at rest keeps cards scannable; the rest sit behind "+N more"
    var MAX_TAGS = 2;
    var isFlippable = !!paper.summary;

    var authors = paper.authors;
    var displayAuthors = authors.slice();

    // Tags: split from semicolon string
    var allTags = paper.tags ? paper.tags.split(";").map(function(t) { return t.trim(); }).filter(Boolean) : [];
    var visibleTags = tagsExpanded ? allTags : allTags.slice(0, MAX_TAGS);
    var hiddenCount = allTags.length - MAX_TAGS;

    var allAwards = paper.awards && paper.awards.length > 0 ? paper.awards : [];

    // PDF link; when nothing is hosted, the primary action falls back to the
    // best external source so every card keeps a working primary link (SF-04)
    var pdfLink = paper.html_paper_url || ("/papers/" + paper.id + "/serve");
    var hasPDF = paper.pdf || paper.html_paper_url;
    var fallbackHref = paper.doi ? ("https://doi.org/" + paper.doi) : scholarUrl(paper);
    var fallbackLabel = paper.doi ? 'Publisher page' : 'Find on Google Scholar';

    // Summary link (tweet thread)
    var summaryLink = paper.tweets;

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
        {formatDownloadCount(paper.downloads) && (
          <div className="pub-download-count" aria-label={parseDownloads(paper.downloads) + ' downloads'} title={parseDownloads(paper.downloads) + ' downloads'}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a.5.5 0 0 1 .5.5v7.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V1.5A.5.5 0 0 1 8 1zM2.5 12a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11z"/>
            </svg>
            {formatDownloadCount(paper.downloads)}
          </div>
        )}
        <div className="pub-card-inner">
          {/* SF-10: no thumbnail block at all when there is no real image;
              SF-04: lazy + explicit dimensions to avoid layout shift */}
          {this.props.thumbnail && (
            <div className="pub-thumb">
              <img src={this.props.thumbnail} alt="" loading="lazy" decoding="async" width="96" height="96" />
            </div>
          )}

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
              href={hasPDF ? pdfLink : fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={hasPDF ? this.handlePdfClick : undefined}
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

            {/* SF-28: compact expert quick-links; SF-32: #N anchors the card in the
                current view; SF-31: BibTeX is one click from the card surface */}
            <div className="pub-quick-links">
              {this.props.num != null && <span className="pub-num">#{this.props.num}</span>}
              {hasPDF && (
                <a
                  className="pub-quick-link"
                  href={pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={this.handlePdfClick}
                >PDF</a>
              )}
              <button
                type="button"
                className="pub-quick-link"
                onClick={function(e) { this.handleCiteToggle(e, 'BibTeX'); }.bind(this)}
                aria-label={"BibTeX citation for " + paper.title}
              >BibTeX</button>
              {isFlippable && (
                <button
                  type="button"
                  className="pub-quick-link"
                  onClick={function(e) { e.stopPropagation(); this.setState({ flipped: true }); }.bind(this)}
                  aria-label={"One-sentence takeaway for " + paper.title}
                >Takeaway</button>
              )}
              <a
                className="pub-quick-link"
                href={scholarUrl(paper)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={"Find " + paper.title + " on Google Scholar (opens in new tab)"}
              >Google Scholar</a>
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
                  className={'pub-action-primary' + (pdfOpening ? ' is-opening' : '')}
                  href={pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={"View PDF: " + paper.title + " (opens in new tab)"}
                  onClick={this.handlePdfClick}
                >
                  {pdfOpening ? (
                    <span className="pub-action-spinner" aria-hidden="true">⟳</span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1zm0 1.5L12.5 5H9V2.5zM5.5 9.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm0-2h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zm0 4h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1z"/>
                    </svg>
                  )}
                  {pdfOpening ? ' Opening PDF…' : ' View PDF'}
                  {!pdfOpening && <span className="pub-ext-cue" aria-hidden="true">↗</span>}
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
              {!hasPDF && (
                <a
                  className="pub-action-primary"
                  href={fallbackHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={fallbackLabel + ' for ' + paper.title + ' (opens in new tab)'}
                >
                  {fallbackLabel}
                  <span className="pub-ext-cue" aria-hidden="true">↗</span>
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}

              {paper.doi && (
                <a
                  className="pub-action-doi"
                  href={"https://doi.org/" + paper.doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={"DOI for " + paper.title + " (opens in new tab)"}
                  onClick={function() { gaSendEvent('Publications', 'DOI', paper.id); }}
                >
                  DOI
                  <span className="pub-ext-cue" aria-hidden="true">↗</span>
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}

              <div className="cite-wrapper" ref={this.citeWrapRef}>
                <button
                  type="button"
                  className={'pub-action-secondary' + (citeOpen ? ' cite-active' : '')}
                  onClick={this.handleCiteToggle}
                  aria-haspopup="dialog"
                  aria-expanded={citeOpen}
                  aria-label={"Cite: " + paper.title}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{display:'inline',verticalAlign:'middle'}}>
                    <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                  {' '}Cite{citeOpen ? ' ▲' : ' ▾'}
                </button>
              </div>
              {/* SF-16: every card gets the same Cite + More pair — More always has
                  alternate sources even when a paper has no extra materials */}
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
                    {this.renderMoreAction(
                      scholarUrl(paper),
                      'Find on Google Scholar',
                      'M6.5 1a5.5 5.5 0 1 0 3.45 9.79l3.63 3.62a.75.75 0 1 0 1.06-1.06l-3.62-3.63A5.5 5.5 0 0 0 6.5 1zM2.5 6.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0z'
                    )}
                    {paper.doi && this.renderMoreAction(
                      "https://doi.org/" + paper.doi,
                      'DOI (publisher page)',
                      'M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287zM6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z'
                    )}
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
                    {/* SF-04: a broken link is recoverable from right here */}
                    <a
                      className="pub-more-item"
                      role="menuitem"
                      href={"mailto:sauvik@cmu.edu?subject=" + encodeURIComponent('Broken link: ' + paper.title)}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z"/></svg>
                      Email me for a copy
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* SF-22/SF-04: say what the tap will do, and where recovery lives */}
            <p className="pub-actions-note">
              {hasPDF ? 'PDF opens in a new tab · ' : ''}if a link is broken, More → alternate sources
            </p>

            {/* SF-07/SF-14/SF-23: inline cite panel — named formats, named copy
                feedback, ASCII-safe BibTeX, .bib download, Esc to close */}
            {citeOpen && (
              <div className="cite-panel" role="dialog" aria-label={"Cite " + paper.title} ref={this.citePanelRef}>
                <div className="cite-panel-head">
                  <span className="cite-panel-title">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M6.5 3C4 3 2 5 2 7.5c0 2 1.5 3.5 3.5 3.5.5 0 1-.1 1.4-.3-.6 1.1-1.6 2-2.9 2.3l.5 1.5c2.9-.7 5-3.3 5-6.5C9.5 5 8.5 3 6.5 3zm7 0C11 3 9 5 9 7.5c0 2 1.5 3.5 3.5 3.5.5 0 1-.1 1.4-.3-.6 1.1-1.6 2-2.9 2.3l.5 1.5c2.9-.7 5-3.3 5-6.5C16.5 5 15.5 3 13.5 3z" transform="scale(0.9)"/>
                    </svg>
                    {' '}Cite this paper
                  </span>
                  <span className="cite-panel-esc" aria-hidden="true">Esc to close</span>
                  <button
                    type="button"
                    className="cite-panel-close"
                    aria-label="Close citation panel"
                    onClick={function(e) { e.stopPropagation(); this.setState({ citeOpen: false }); }.bind(this)}
                  >×</button>
                </div>
                <div className="cite-panel-tabs" role="tablist" aria-label="Citation format">
                  {['BibTeX', 'APA', 'MLA', 'RIS'].map(function(fmt) {
                    return (
                      <button
                        key={fmt}
                        type="button"
                        role="tab"
                        aria-selected={citeFormat === fmt}
                        className={'cite-panel-tab' + (citeFormat === fmt ? ' active' : '')}
                        onClick={function(e) { e.stopPropagation(); this.setState({ citeFormat: fmt, copiedFormat: null }); }.bind(this)}
                      >{fmt}</button>
                    );
                  }.bind(this))}
                </div>
                <div className="cite-panel-confirm">
                  <span aria-hidden="true">✓</span> Showing {citeFormat} — the Copy button below always names the format you will get
                </div>
                <pre className="cite-panel-text">{this.getCitationText(citeFormat)}</pre>
                {citeFormat === 'BibTeX' && (
                  <p className="cite-panel-ascii">ASCII-safe output — smart quotes and accents are transliterated so BibTeX compiles in any toolchain.</p>
                )}
                <div className="cite-panel-actions">
                  <button
                    type="button"
                    className={'cite-panel-copy' + (copiedFormat === citeFormat ? ' copied' : '')}
                    onClick={function(e) { this.handleCopyFormat(citeFormat, e); }.bind(this)}
                  >
                    {copiedFormat === citeFormat ? '✓ Copied ' + citeFormat : 'Copy ' + citeFormat}
                  </button>
                  {citeFormat === 'BibTeX' && (
                    <button type="button" className="cite-panel-download" onClick={this.handleDownloadBib}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 1a.5.5 0 0 1 .5.5v7.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V1.5A.5.5 0 0 1 8 1zM2.5 12a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11z"/>
                      </svg>
                      {' '}Download .bib
                    </button>
                  )}
                </div>
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {copiedFormat ? copiedFormat + ' citation copied to clipboard' : ''}
                </div>
              </div>
            )}
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
      tags:             p.tags || '',
      featured:         !!p.featured
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
        tags:             s.tags,
        featured:         s.featured
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
        <Checkbox name="Featured" label="Featured" checked={s.featured} onChange={this._set('featured')} />
        <InputField name="Summary"         type="text" value={s.summary}          onChange={this._set('summary')} />
        <InputField name="Downloads"       type="number" value={s.downloads}      onChange={this._set('downloads')} />
        <SubmitButton/>
      </form>
    );
  }
}
