// Publications section shell: tabs, search-first toolbar (SF-09), URL-synced
// filter state with Back/Forward support (SF-13), touch-friendly More-filters
// sheet (SF-06), and tab-scope helper text (SF-07).

// Tag labels ↔ URL slugs (SF-13): "Social Cybersecurity" ↔ "social-cybersecurity"
function slugifyTag(label) {
  return (label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

var AWARD_FILTER = 'Award-winning';

class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    var initialState = this.getInitialStateFromUrl();
    this.state = {
      activeTab: initialState.activeTab,
      query: initialState.query,
      tag: initialState.tag,
      sort: initialState.sort,
      year: initialState.year,
      pendingTagSlug: initialState.pendingTagSlug,
      rendered: null,
      total: null,
      topTags: [],
      allTags: [],
      chipCounts: {},
      moreFiltersOpen: false,
      tagQuery: '',
      sheetTag: null,
      copied: false
    };
    this.tabRefs = {};
    this.searchRef = React.createRef();
    this._keyHandler = null;
    this._pushNextSync = false;
    this._restoringFromUrl = false;
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleTagToggle = this.handleTagToggle.bind(this);
    this.handleSortToggle = this.handleSortToggle.bind(this);
    this.handleYearChange = this.handleYearChange.bind(this);
    this.handleResultCount = this.handleResultCount.bind(this);
    this.handleChipCounts = this.handleChipCounts.bind(this);
    this.handleTopTags = this.handleTopTags.bind(this);
    this.handleAllTags = this.handleAllTags.bind(this);
    this.handleTabKeyDown = this.handleTabKeyDown.bind(this);
    this.handleResetFilters = this.handleResetFilters.bind(this);
    this.handleCopyLink = this.handleCopyLink.bind(this);
    this.registerTabRef = this.registerTabRef.bind(this);
    this.emitQueryChanged = this.emitQueryChanged.bind(this);
    this.emitQueryAndSyncState = this.emitQueryAndSyncState.bind(this);
    this.syncUrlState = this.syncUrlState.bind(this);
    this.scrollPublicationsToTop = this.scrollPublicationsToTop.bind(this);
  }

  getInitialStateFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var tab = params.get('tab');
      var validTab = ['publications', 'awards', 'teaching'].indexOf(tab) >= 0 ? tab : 'publications';
      var query = params.get('q') || '';
      var sort = params.get('sort') === 'downloads' ? 'downloads' : 'newest';
      var year = null;
      if (/^20\d\d$/.test(params.get('year') || '')) year = parseInt(params.get('year'), 10);

      var tag = null;
      var pendingTagSlug = null;
      var tagSlug = params.get('tag');
      if (tagSlug === slugifyTag(AWARD_FILTER)) {
        tag = AWARD_FILTER;
      } else if (tagSlug) {
        // Real tag labels arrive with the papers payload — resolve in handleAllTags
        pendingTagSlug = tagSlug;
      }

      // Legacy params from the previous URL scheme
      var legacyFilter = params.get('filter');
      if (legacyFilter === 'Most downloaded') sort = 'downloads';
      else if (legacyFilter) tag = legacyFilter;

      return { activeTab: validTab, query: query, tag: tag, sort: sort, year: year, pendingTagSlug: pendingTagSlug };
    } catch (_) {
      return { activeTab: 'publications', query: '', tag: null, sort: 'newest', year: null, pendingTagSlug: null };
    }
  }

  componentDidMount() {
    const isTypingTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    this._keyHandler = (e) => {
      const active = document.activeElement;

      if (e.key === 'Escape') {
        if (this.searchRef.current) this.searchRef.current.blur();
        return;
      }

      if (isTypingTarget(active)) return;

      if (e.key === '/') {
        e.preventDefault();
        this.setState({ activeTab: 'publications' }, () => {
          if (this.searchRef.current) this.searchRef.current.focus();
        });
      } else if (e.key === 'j') {
        window.scrollBy({ top: 80, behavior: 'smooth' });
      } else if (e.key === 'k') {
        window.scrollBy({ top: -80, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    // When a student card is clicked, update the search query
    this._studentFilterHandler = (e) => {
      var studentName = (e.detail && e.detail.studentName) || "";
      this.handleQueryChange(studentName);
      var pubsEl = document.getElementById('publications');
      if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('studentFilterChanged', this._studentFilterHandler);

    // When an author/tag/venue is clicked inside a paper card, filter by that value
    this._setSearchHandler = (e) => {
      var value = (e.detail && e.detail.value) || "";
      this.setState({ activeTab: 'publications', query: value }, this.emitQueryAndSyncState);
      var pubsEl = document.getElementById('publications');
      if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('setSearchFilter', this._setSearchHandler);

    // Activate a quick-filter chip programmatically (e.g. from the awards link in the bio)
    this._setActiveFilterHandler = (e) => {
      var filter = (e.detail && e.detail.filter) || null;
      this._pushNextSync = true;
      if (filter === 'Most downloaded') {
        this.setState({ activeTab: 'publications', sort: 'downloads' });
      } else {
        this.setState({ activeTab: 'publications', tag: filter, pendingTagSlug: null });
      }
    };
    window.addEventListener('setActiveFilter', this._setActiveFilterHandler);

    // SF-13: Back/Forward restore the filter state encoded in the URL
    this._popstateHandler = () => {
      this._restoringFromUrl = true;
      var restored = this.getInitialStateFromUrl();
      this.setState(restored, () => {
        this._restoringFromUrl = false;
        this.emitQueryChanged();
      });
    };
    window.addEventListener('popstate', this._popstateHandler);

    this.emitQueryChanged();

    if ((this.state.tag || this.state.pendingTagSlug || this.state.year || this.state.sort === 'downloads') && !window.location.hash) {
      this.scrollPublicationsToTop();
      window.requestAnimationFrame(this.scrollPublicationsToTop);
      window.setTimeout(this.scrollPublicationsToTop, 250);
      window.setTimeout(this.scrollPublicationsToTop, 750);
      if (document.readyState === 'complete') {
        window.setTimeout(this.scrollPublicationsToTop, 0);
      } else {
        window.addEventListener('load', this.scrollPublicationsToTop, { once: true });
      }
    }

    // When the page loads with a hash in the URL, the browser scrolls before React has
    // mounted and laid out dynamic sections (students, publications), landing at the wrong
    // position. A single rAF fires after React has rendered, re-scrolling instantly to the
    // correct position. 'instant' avoids a visible smooth-scroll animation on page load.
    var hash = window.location.hash.slice(1);
    if (hash) {
      window.requestAnimationFrame(function() {
        var el = document.getElementById(hash);
        if (!el) return;
        var top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
        window.scrollTo({ top: top, behavior: 'instant' });
      });
    }
  }

  componentWillUnmount() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._studentFilterHandler) window.removeEventListener('studentFilterChanged', this._studentFilterHandler);
    if (this._setSearchHandler) window.removeEventListener('setSearchFilter', this._setSearchHandler);
    if (this._setActiveFilterHandler) window.removeEventListener('setActiveFilter', this._setActiveFilterHandler);
    if (this._popstateHandler) window.removeEventListener('popstate', this._popstateHandler);
    window.removeEventListener('load', this.scrollPublicationsToTop);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.activeTab !== this.state.activeTab ||
      prevState.query !== this.state.query ||
      prevState.tag !== this.state.tag ||
      prevState.sort !== this.state.sort ||
      prevState.year !== this.state.year
    ) {
      if (!this._restoringFromUrl) {
        this.syncUrlState(this._pushNextSync);
      }
      this._pushNextSync = false;
      if (prevState.query !== this.state.query) this.emitQueryChanged();
    }
  }

  registerTabRef(name, el) {
    if (!el) return;
    this.tabRefs[name] = el;
  }

  emitQueryChanged() {
    window.dispatchEvent(new CustomEvent('searchFilterChanged', { detail: { searchTerm: this.state.query } }));
  }

  emitQueryAndSyncState() {
    this.emitQueryChanged();
    this.syncUrlState(false);
  }

  buildParamString() {
    var params = new URLSearchParams(window.location.search);
    if (this.state.activeTab && this.state.activeTab !== 'publications') params.set('tab', this.state.activeTab);
    else params.delete('tab');
    if (this.state.query) params.set('q', this.state.query);
    else params.delete('q');
    var tagSlug = this.state.tag ? slugifyTag(this.state.tag) : this.state.pendingTagSlug;
    if (tagSlug) params.set('tag', tagSlug);
    else params.delete('tag');
    if (this.state.sort === 'downloads') params.set('sort', 'downloads');
    else params.delete('sort');
    if (this.state.year) params.set('year', String(this.state.year));
    else params.delete('year');
    // Legacy params are superseded by the vocabulary above
    params.delete('filter');
    params.delete('view');
    return params.toString();
  }

  // SF-13: filter state lives in the URL. Deliberate filter changes push a
  // history entry (Back walks them); incidental sync (typing) replaces.
  syncUrlState(push) {
    try {
      var nextQuery = this.buildParamString();
      var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + window.location.hash;
      if (push) window.history.pushState({}, '', nextUrl);
      else window.history.replaceState(window.history.state, '', nextUrl);
    } catch (_) {}
  }

  scrollPublicationsToTop() {
    var pubsEl = document.getElementById('publications');
    if (!pubsEl) return;

    var top = pubsEl.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  handleQueryChange(query) {
    this.setState({ query: query, activeTab: 'publications' });
  }

  handleTagToggle(tagLabel) {
    this._pushNextSync = true;
    this.setState(prev => ({
      activeTab: 'publications',
      tag: prev.tag === tagLabel ? null : tagLabel,
      pendingTagSlug: null
    }));
    var pubsEl = document.getElementById('publications');
    if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
  }

  handleSortToggle(sort) {
    this._pushNextSync = true;
    this.setState({ sort: sort, activeTab: 'publications' });
  }

  handleYearChange(year) {
    this._pushNextSync = true;
    this.setState({ year: year, activeTab: 'publications' });
  }

  handleResetFilters() {
    this._pushNextSync = true;
    this.setState({ tag: null, pendingTagSlug: null, query: '', sort: 'newest', year: null, activeTab: 'publications' });
  }

  // SF-13: one-click share of the current filtered view
  handleCopyLink() {
    var self = this;
    var url = window.location.href;
    var markCopied = function() {
      self.setState({ copied: true });
      window.setTimeout(function() { self.setState({ copied: false }); }, 2000);
      if (window.gaSendEvent) window.gaSendEvent('Publications', 'CopyLink', url);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(markCopied, function() {});
    } else {
      var input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      markCopied();
    }
  }

  handleTabKeyDown(e) {
    var tabs = ['publications', 'awards', 'teaching'];
    var currentIndex = tabs.indexOf(this.state.activeTab);
    if (currentIndex < 0) return;
    var nextIndex = null;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') nextIndex = 0;
    if (e.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    var nextTab = tabs[nextIndex];
    this.setState({ activeTab: nextTab }, function() {
      if (this.tabRefs[nextTab]) this.tabRefs[nextTab].focus();
    }.bind(this));
  }

  handleResultCount(info) {
    var rendered = info && typeof info === 'object' ? info.rendered : info;
    var total = info && typeof info === 'object' ? info.total : info;
    if (this.state.rendered !== rendered || this.state.total !== total) {
      this.setState({ rendered: rendered, total: total });
    }
  }

  handleChipCounts(counts) {
    this.setState({ chipCounts: counts || {} });
  }

  handleTopTags(tags) {
    this.setState({ topTags: tags });
  }

  handleAllTags(tags) {
    var update = { allTags: tags };
    // Resolve a ?tag= slug from the URL once real tag labels are known
    if (this.state.pendingTagSlug) {
      var slug = this.state.pendingTagSlug;
      var match = tags.find(function(t) { return slugifyTag(t) === slug; });
      if (match) {
        update.tag = match;
        update.pendingTagSlug = null;
      }
    }
    this.setState(update);
  }

  render() {
    const { activeTab, query, tag, sort, year, rendered, total, allTags, chipCounts, moreFiltersOpen, tagQuery, sheetTag, copied } = this.state;
    const hasActiveFilters = !!(query || tag || year || sort === 'downloads');
    const labelWithCount = (key, label) => {
      var c = chipCounts[key];
      return (c === null || c === undefined) ? label : label + ' ' + c;
    };
    var countText = '';
    if (total !== null && total !== undefined) {
      countText = total === 0 ? 'No papers' : ('Showing 1–' + rendered + ' of ' + total + ' papers');
    }
    var paramString = this.buildParamString();
    var urlPillText = paramString ? '?' + paramString : '/publications';
    // A non-default tag (from the More-filters sheet) gets its own active chip
    var extraTagChip = tag && tag !== AWARD_FILTER ? tag : null;

    return (
      <div className="pubs-section">
        <div className="pubs-sticky-header">
          <div className="pubs-tabs-row">
            <div className="pubs-tabs" role="tablist" aria-label="Publications panel" onKeyDown={this.handleTabKeyDown}>
              <button
                id="tab-publications"
                ref={(el) => this.registerTabRef('publications', el)}
                role="tab"
                aria-selected={activeTab === 'publications'}
                aria-controls="panel-publications"
                className={'pubs-tab' + (activeTab === 'publications' ? ' active' : '')}
                onClick={() => this.setState({ activeTab: 'publications' })}
                tabIndex={activeTab === 'publications' ? 0 : -1}
              >Publications</button>
              <button
                id="tab-awards"
                ref={(el) => this.registerTabRef('awards', el)}
                role="tab"
                aria-selected={activeTab === 'awards'}
                aria-controls="panel-awards"
                className={'pubs-tab' + (activeTab === 'awards' ? ' active' : '')}
                onClick={() => this.setState({ activeTab: 'awards' })}
                tabIndex={activeTab === 'awards' ? 0 : -1}
              >Honors &amp; Awards</button>
              <button
                id="tab-teaching"
                ref={(el) => this.registerTabRef('teaching', el)}
                role="tab"
                aria-selected={activeTab === 'teaching'}
                aria-controls="panel-teaching"
                className={'pubs-tab' + (activeTab === 'teaching' ? ' active' : '')}
                onClick={() => this.setState({ activeTab: 'teaching' })}
                tabIndex={activeTab === 'teaching' ? 0 : -1}
              >Teaching</button>
            </div>
            {/* SF-07: disambiguate in-panel tabs from left-rail section navigation */}
            <p className="pubs-tabs-hint">
              <span className="pubs-tabs-hint-desktop">These tabs switch this panel only — the left rail moves you between page sections.</span>
              <span className="pubs-tabs-hint-mobile">Tabs switch this panel. Use the menu to jump between page sections.</span>
            </p>
          </div>

          {activeTab === 'publications' && (
            <div>
              <div className="pubs-search-row">
                <label htmlFor="pubs-search-input" className="sr-only">Search publications by title, author, venue, or tag</label>
                <div className="pubs-search-wrap pubs-search-elevated">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}>
                    <circle cx="6.5" cy="6.5" r="4"/>
                    <line x1="10" y1="10" x2="14" y2="14"/>
                  </svg>
                  <input
                    id="pubs-search-input"
                    ref={this.searchRef}
                    type="text"
                    className="pubs-search"
                    placeholder="Search papers, authors, venues…"
                    value={query}
                    onChange={e => this.handleQueryChange(e.target.value)}
                  />
                  {query
                    ? <button className="pubs-search-clear" aria-label="Clear search" onClick={() => this.handleQueryChange('')}>×</button>
                    : <kbd className="pubs-search-kbd" aria-hidden="true">/</kbd>}
                </div>
              </div>
              {/* SF-09: three high-signal chips; every other facet lives in More filters */}
              <div className="pubs-filters-row">
                <div className="pubs-filters">
                  <button
                    aria-pressed={!tag && !year && sort !== 'downloads'}
                    className={'pubs-filter-chip' + (!tag && !year && sort !== 'downloads' ? ' active' : '')}
                    onClick={this.handleResetFilters}
                  >{labelWithCount('All', 'All')}</button>
                  <button
                    aria-pressed={tag === AWARD_FILTER}
                    className={'pubs-filter-chip' + (tag === AWARD_FILTER ? ' active' : '')}
                    onClick={() => this.handleTagToggle(AWARD_FILTER)}
                  >{labelWithCount(AWARD_FILTER, AWARD_FILTER)}</button>
                  <button
                    aria-pressed={sort === 'downloads'}
                    className={'pubs-filter-chip' + (sort === 'downloads' ? ' active' : '')}
                    onClick={() => this.handleSortToggle(sort === 'downloads' ? 'newest' : 'downloads')}
                  >{labelWithCount('Most downloaded', 'Most downloaded')}</button>
                  {extraTagChip && (
                    <button
                      aria-pressed="true"
                      className="pubs-filter-chip active"
                      onClick={() => this.handleTagToggle(extraTagChip)}
                    >{labelWithCount(extraTagChip, extraTagChip)}</button>
                  )}
                  {year && (
                    <button
                      aria-pressed="true"
                      className="pubs-filter-chip active"
                      onClick={() => this.handleYearChange(null)}
                    >{String(year)}</button>
                  )}
                  {allTags.length > 0 && (
                    <button
                      className="pubs-filter-chip pubs-more-filters"
                      aria-haspopup="dialog"
                      onClick={() => this.setState({ moreFiltersOpen: true, sheetTag: tag })}
                    >
                      <span aria-hidden="true">⚙ </span>More filters <span aria-hidden="true">▾</span>
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button className="pubs-clear-all" onClick={this.handleResetFilters}>Clear filters</button>
                  )}
                </div>
                {/* SF-13: crawlable address + one-click share of the current view */}
                <div className="pubs-url-tools">
                  <a className="pubs-url-pill" href={'/publications' + (paramString ? '?' + paramString : '')} data-turbolinks="false">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span>{urlPillText}</span>
                  </a>
                  <button className="pubs-copy-link" onClick={this.handleCopyLink}>
                    {copied ? '✓ Copied' : 'Copy link'}
                  </button>
                </div>
              </div>
              <div className="pubs-results-bar">
                <span className="pubs-result-count" aria-live="polite">{countText}</span>
                <label className="pubs-sort">
                  <span className="sr-only">Sort papers</span>
                  <select
                    className="pubs-sort-select"
                    value={sort}
                    onChange={e => this.handleSortToggle(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="downloads">Most downloaded</option>
                  </select>
                </label>
              </div>
              {moreFiltersOpen && (
                <div className="tag-sheet-overlay" onClick={() => this.setState({ moreFiltersOpen: false, tagQuery: '' })}>
                  {/* SF-06: bottom sheet on mobile — big rows, explicit Apply */}
                  <div className="tag-sheet" role="dialog" aria-label="More filters" onClick={e => e.stopPropagation()}>
                    <div className="tag-sheet-handle" aria-hidden="true"></div>
                    <div className="tag-sheet-head">
                      <span>More filters</span>
                      <button className="tag-sheet-close" aria-label="Close" onClick={() => this.setState({ moreFiltersOpen: false, tagQuery: '' })}>×</button>
                    </div>
                    <input
                      className="tag-sheet-search"
                      type="text"
                      placeholder="Search topics…"
                      value={tagQuery}
                      onChange={e => this.setState({ tagQuery: e.target.value })}
                    />
                    <div className="tag-sheet-list">
                      {allTags
                        .filter(t => t.toLowerCase().indexOf((tagQuery || '').toLowerCase()) >= 0)
                        .map(t => (
                          <button
                            key={t}
                            className={'tag-sheet-item' + (sheetTag === t ? ' active' : '')}
                            aria-pressed={sheetTag === t}
                            onClick={() => this.setState({ sheetTag: sheetTag === t ? null : t })}
                          >
                            <span className="tag-sheet-item-label">{labelWithCount(t, t)}</span>
                            <span className={'tag-sheet-check' + (sheetTag === t ? ' checked' : '')} aria-hidden="true"></span>
                          </button>
                        ))}
                    </div>
                    <button
                      className="tag-sheet-apply"
                      onClick={() => {
                        this._pushNextSync = true;
                        this.setState({ tag: sheetTag, pendingTagSlug: null, activeTab: 'publications', moreFiltersOpen: false, tagQuery: '' });
                        var pubsEl = document.getElementById('publications');
                        if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >Apply filters</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'publications' && (
          <div id="panel-publications" role="tabpanel" aria-labelledby="tab-publications">
            <PaperContainer
              url={this.props.papersUrl}
              assets={this.props.paperAssets}
              pollInterval={this.props.paperPollInterval}
              studentFilter={this.props.studentFilter}
              currentStudents={this.props.currentStudents}
              alums={this.props.alums}
              query={query}
              activeTag={tag}
              sort={sort}
              year={year}
              onResetFilters={this.handleResetFilters}
              onTagToggle={this.handleTagToggle}
              onYearChange={this.handleYearChange}
              onResultCount={this.handleResultCount}
              onChipCounts={this.handleChipCounts}
              onTopTags={this.handleTopTags}
              onAllTags={this.handleAllTags}
            />
          </div>
        )}

        {activeTab === 'awards' && (
          <div id="panel-awards" role="tabpanel" aria-labelledby="tab-awards">
            <AwardContainer url={this.props.awardsUrl} />
          </div>
        )}

        {activeTab === 'teaching' && (
          <div id="panel-teaching" role="tabpanel" aria-labelledby="tab-teaching">
            <CoursesContainer data={this.props.courses} />
          </div>
        )}
      </div>
    );
  }
}
