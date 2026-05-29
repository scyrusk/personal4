class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    var initialState = this.getInitialStateFromUrl();
    this.state = {
      activeTab: initialState.activeTab,
      query: initialState.query,
      activeFilter: initialState.activeFilter,
      pubsView: initialState.pubsView,
      rendered: null,
      total: null,
      topTags: [],
      allTags: [],
      chipCounts: {},
      moreFiltersOpen: false,
      tagQuery: ''
    };
    this.tabRefs = {};
    this.searchRef = React.createRef();
    this._keyHandler = null;
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleFilterToggle = this.handleFilterToggle.bind(this);
    this.handleResultCount = this.handleResultCount.bind(this);
    this.handleChipCounts = this.handleChipCounts.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleTopTags = this.handleTopTags.bind(this);
    this.handleAllTags = this.handleAllTags.bind(this);
    this.handleTabKeyDown = this.handleTabKeyDown.bind(this);
    this.handleResetFilters = this.handleResetFilters.bind(this);
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
      var query = params.get('q') || '';
      var activeFilter = params.get('filter') || null;
      var validTab = ['publications', 'awards', 'teaching'].indexOf(tab) >= 0 ? tab : 'publications';
      var view = params.get('view') === 'all' ? 'all' : 'featured';
      return { activeTab: validTab, query: query, activeFilter: activeFilter, pubsView: view };
    } catch (_) {
      return { activeTab: 'publications', query: '', activeFilter: null, pubsView: 'featured' };
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
      this.setState({ activeTab: 'publications', activeFilter: filter }, this.syncUrlState);
    };
    window.addEventListener('setActiveFilter', this._setActiveFilterHandler);
    this.emitQueryAndSyncState();

    if (this.state.activeFilter && !window.location.hash) {
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
  }

  componentWillUnmount() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._studentFilterHandler) window.removeEventListener('studentFilterChanged', this._studentFilterHandler);
    if (this._setSearchHandler) window.removeEventListener('setSearchFilter', this._setSearchHandler);
    if (this._setActiveFilterHandler) window.removeEventListener('setActiveFilter', this._setActiveFilterHandler);
    window.removeEventListener('load', this.scrollPublicationsToTop);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.activeTab !== this.state.activeTab ||
      prevState.query !== this.state.query ||
      prevState.activeFilter !== this.state.activeFilter ||
      prevState.pubsView !== this.state.pubsView
    ) {
      this.syncUrlState();
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
    this.syncUrlState();
  }

  syncUrlState() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (this.state.activeTab && this.state.activeTab !== 'publications') params.set('tab', this.state.activeTab);
      else params.delete('tab');
      if (this.state.query) params.set('q', this.state.query);
      else params.delete('q');
      if (this.state.activeFilter) params.set('filter', this.state.activeFilter);
      else params.delete('filter');
      if (this.state.pubsView === 'all') params.set('view', 'all');
      else params.delete('view');
      var nextQuery = params.toString();
      var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + window.location.hash;
      window.history.replaceState({}, '', nextUrl);
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

  handleFilterToggle(filter) {
    this.setState(prev => ({
      activeTab: 'publications',
      activeFilter: prev.activeFilter === filter ? null : filter
    }));
    var pubsEl = document.getElementById('publications');
    if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
  }

  handleResetFilters() {
    this.setState({ activeFilter: null, query: '', activeTab: 'publications' });
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

  handleViewChange(view) {
    this.setState({ pubsView: view, activeTab: 'publications' });
  }

  handleTopTags(tags) {
    this.setState({ topTags: tags });
  }

  handleAllTags(tags) {
    this.setState({ allTags: tags });
  }

  render() {
    const { activeTab, query, activeFilter, pubsView, rendered, total, topTags, allTags, chipCounts, moreFiltersOpen, tagQuery } = this.state;
    const hasFeatured = chipCounts['Featured'] > 0;
    const baseFilters = hasFeatured ? ["Featured", "Award-winning", "Most downloaded"] : ["Award-winning", "Most downloaded"];
    const FILTERS = baseFilters.concat(topTags);
    const hasActiveFilters = !!(query || activeFilter);
    const labelWithCount = (key, label) => {
      var c = chipCounts[key];
      return (c === null || c === undefined) ? label : label + ' ' + c;
    };
    const inFeaturedView = hasFeatured && pubsView === 'featured' && !query && !activeFilter;
    var countText = '';
    if (inFeaturedView) {
      countText = (total !== null && total !== undefined && total > 0) ? ('Showing selected work · ' + total + ' papers total') : '';
    } else if (total !== null && total !== undefined) {
      countText = total === 0 ? 'No papers' : ('Showing 1–' + rendered + ' of ' + total + ' papers');
    }

    return (
      <div className="pubs-section">
        <div className="pubs-sticky-header">
          <div className="pubs-tabs" role="tablist" aria-label="Sections" onKeyDown={this.handleTabKeyDown}>
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
              <div className="pubs-filters">
                <button
                  aria-pressed={!activeFilter}
                  className={'pubs-filter-chip' + (!activeFilter ? ' active' : '')}
                  onClick={() => this.setState({ activeFilter: null, activeTab: 'publications' })}
                >{labelWithCount('All', 'All')}</button>
                {FILTERS.map(f => (
                  <button
                    key={f}
                    aria-pressed={activeFilter === f}
                    className={'pubs-filter-chip' + (activeFilter === f ? ' active' : '')}
                    onClick={() => this.handleFilterToggle(f)}
                  >{labelWithCount(f, f)}</button>
                ))}
                {allTags.length > topTags.length && (
                  <button
                    className="pubs-filter-chip pubs-more-filters"
                    aria-haspopup="dialog"
                    onClick={() => this.setState({ moreFiltersOpen: true })}
                  >
                    <span aria-hidden="true">⚙ </span>More filters
                  </button>
                )}
                {hasActiveFilters && (
                  <button className="pubs-clear-all" onClick={this.handleResetFilters}>Clear all</button>
                )}
              </div>
              <div className="pubs-results-bar">
                <span className="pubs-result-count" aria-live="polite">{countText}</span>
                {hasActiveFilters && (
                  <span className="pubs-active-filters" aria-label="Active filters">
                    {activeFilter && (
                      <button className="active-filter-pill" onClick={() => this.setState({ activeFilter: null })}>
                        {activeFilter} ×
                      </button>
                    )}
                    {query && (
                      <button className="active-filter-pill" onClick={() => this.setState({ query: '' })}>
                        “{query}” ×
                      </button>
                    )}
                  </span>
                )}
              </div>
              {moreFiltersOpen && (
                <div className="tag-sheet-overlay" onClick={() => this.setState({ moreFiltersOpen: false, tagQuery: '' })}>
                  <div className="tag-sheet" role="dialog" aria-label="All topics" onClick={e => e.stopPropagation()}>
                    <div className="tag-sheet-head">
                      <span>All topics</span>
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
                            className={'tag-sheet-item' + (activeFilter === t ? ' active' : '')}
                            onClick={() => {
                              this.setState({ activeFilter: t, activeTab: 'publications', moreFiltersOpen: false, tagQuery: '' });
                              var pubsEl = document.getElementById('publications');
                              if (pubsEl) pubsEl.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >{labelWithCount(t, t)}</button>
                        ))}
                    </div>
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
              activeFilter={activeFilter}
              view={pubsView}
              filters={FILTERS}
              onViewChange={this.handleViewChange}
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
