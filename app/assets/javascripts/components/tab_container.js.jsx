class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    var initialState = this.getInitialStateFromUrl();
    this.state = {
      activeTab: initialState.activeTab,
      query: initialState.query,
      activeFilter: initialState.activeFilter,
      resultCount: null,
      topTags: []
    };
    this.tabRefs = {};
    this.searchRef = React.createRef();
    this._keyHandler = null;
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleFilterToggle = this.handleFilterToggle.bind(this);
    this.handleResultCount = this.handleResultCount.bind(this);
    this.handleTopTags = this.handleTopTags.bind(this);
    this.handleTabKeyDown = this.handleTabKeyDown.bind(this);
    this.handleResetFilters = this.handleResetFilters.bind(this);
    this.registerTabRef = this.registerTabRef.bind(this);
    this.emitQueryChanged = this.emitQueryChanged.bind(this);
    this.emitQueryAndSyncState = this.emitQueryAndSyncState.bind(this);
    this.syncUrlState = this.syncUrlState.bind(this);
  }

  getInitialStateFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var tab = params.get('tab');
      var query = params.get('q') || '';
      var activeFilter = params.get('filter') || null;
      var validTab = ['publications', 'awards', 'teaching'].indexOf(tab) >= 0 ? tab : 'publications';
      return { activeTab: validTab, query: query, activeFilter: activeFilter };
    } catch (_) {
      return { activeTab: 'publications', query: '', activeFilter: null };
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
  }

  componentWillUnmount() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._studentFilterHandler) window.removeEventListener('studentFilterChanged', this._studentFilterHandler);
    if (this._setSearchHandler) window.removeEventListener('setSearchFilter', this._setSearchHandler);
    if (this._setActiveFilterHandler) window.removeEventListener('setActiveFilter', this._setActiveFilterHandler);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.activeTab !== this.state.activeTab ||
      prevState.query !== this.state.query ||
      prevState.activeFilter !== this.state.activeFilter
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
      var nextQuery = params.toString();
      var nextUrl = window.location.pathname + (nextQuery ? '?' + nextQuery : '') + window.location.hash;
      window.history.replaceState({}, '', nextUrl);
    } catch (_) {}
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

  handleResultCount(count) {
    if (this.state.resultCount !== count) {
      this.setState({ resultCount: count });
    }
  }

  handleTopTags(tags) {
    this.setState({ topTags: tags });
  }

  render() {
    const { activeTab, query, activeFilter, resultCount, topTags } = this.state;
    const FILTERS = ["Featured", "Award-winning", "Most downloaded"].concat(topTags);
    const hasActiveFilters = !!(query || activeFilter);

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
                <div className="pubs-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}>
                    <circle cx="6.5" cy="6.5" r="4"/>
                    <line x1="10" y1="10" x2="14" y2="14"/>
                  </svg>
                  <input
                    ref={this.searchRef}
                    type="text"
                    className="pubs-search"
                    placeholder="Search by title, author, venue, or tag"
                    value={query}
                    onChange={e => this.handleQueryChange(e.target.value)}
                  />
                  {query && (
                    <button className="pubs-search-clear" aria-label="Clear search" onClick={() => this.handleQueryChange('')}>×</button>
                  )}
                </div>
                <span className="pubs-result-count">
                  {resultCount !== null ? resultCount + ' papers' : ''}
                </span>
              </div>
              <div className="pubs-filters">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    aria-pressed={activeFilter === f}
                    className={'pubs-filter-chip' + (activeFilter === f ? ' active' : '')}
                    onClick={() => this.handleFilterToggle(f)}
                  >{f}</button>
                ))}
              </div>
              {hasActiveFilters && (
                <div className="pubs-active-filters" aria-label="Active filters">
                  {activeFilter && (
                    <button className="active-filter-pill" onClick={() => this.setState({ activeFilter: null })}>
                      Filter: {activeFilter} ×
                    </button>
                  )}
                  {query && (
                    <button className="active-filter-pill" onClick={() => this.setState({ query: '' })}>
                      Query: {query} ×
                    </button>
                  )}
                  <button className="active-filter-reset" onClick={this.handleResetFilters}>
                    Reset filters
                  </button>
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
              onResultCount={this.handleResultCount}
              onTopTags={this.handleTopTags}
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
