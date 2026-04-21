class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'publications',
      query: '',
      activeFilter: null,
      resultCount: null,
      topTags: []
    };
    this.searchRef = React.createRef();
    this._keyHandler = null;
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleFilterToggle = this.handleFilterToggle.bind(this);
    this.handleResultCount = this.handleResultCount.bind(this);
    this.handleTopTags = this.handleTopTags.bind(this);
  }

  componentDidMount() {
    this._keyHandler = (e) => {
      if (e.key === '/' && document.activeElement !== this.searchRef.current && this.state.activeTab === 'publications') {
        e.preventDefault();
        if (this.searchRef.current) this.searchRef.current.focus();
      }
      if (e.key === 'Escape') {
        if (this.searchRef.current) this.searchRef.current.blur();
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    // When a student card is clicked, update the search query
    this._studentFilterHandler = (e) => {
      var studentName = (e.detail && e.detail.studentName) || "";
      this.handleQueryChange(studentName);
    };
    window.addEventListener('studentFilterChanged', this._studentFilterHandler);

    // When an author/tag/venue is clicked inside a paper card, filter by that value
    this._setSearchHandler = (e) => {
      var value = (e.detail && e.detail.value) || "";
      this.setState({ activeTab: 'publications' });
      this.handleQueryChange(value);
    };
    window.addEventListener('setSearchFilter', this._setSearchHandler);

    // Activate a quick-filter chip programmatically (e.g. from the awards link in the bio)
    this._setActiveFilterHandler = (e) => {
      var filter = (e.detail && e.detail.filter) || null;
      this.setState({ activeTab: 'publications', activeFilter: filter });
    };
    window.addEventListener('setActiveFilter', this._setActiveFilterHandler);
  }

  componentWillUnmount() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._studentFilterHandler) window.removeEventListener('studentFilterChanged', this._studentFilterHandler);
    if (this._setSearchHandler) window.removeEventListener('setSearchFilter', this._setSearchHandler);
    if (this._setActiveFilterHandler) window.removeEventListener('setActiveFilter', this._setActiveFilterHandler);
  }

  handleQueryChange(query) {
    this.setState({ query });
    // Notify students component so it can highlight the matching student
    window.dispatchEvent(new CustomEvent('searchFilterChanged', { detail: { searchTerm: query } }));
  }

  handleFilterToggle(filter) {
    this.setState(prev => ({
      activeFilter: prev.activeFilter === filter ? null : filter
    }));
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
    const FILTERS = ["Award-winning"].concat(topTags);

    return (
      <div className="pubs-section">
        <div className="pubs-sticky-header">
          <div className="pubs-tabs">
            <button
              className={'pubs-tab' + (activeTab === 'publications' ? ' active' : '')}
              onClick={() => this.setState({ activeTab: 'publications' })}
            >Publications</button>
            <button
              className={'pubs-tab' + (activeTab === 'awards' ? ' active' : '')}
              onClick={() => this.setState({ activeTab: 'awards' })}
            >Honors &amp; Awards</button>
            <button
              className={'pubs-tab' + (activeTab === 'teaching' ? ' active' : '')}
              onClick={() => this.setState({ activeTab: 'teaching' })}
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
                    <button className="pubs-search-clear" onClick={() => this.handleQueryChange('')}>×</button>
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
                    className={'pubs-filter-chip' + (activeFilter === f ? ' active' : '')}
                    onClick={() => this.handleFilterToggle(f)}
                  >{f}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab === 'publications' && (
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
        )}

        {activeTab === 'awards' && (
          <AwardContainer url={this.props.awardsUrl} />
        )}

        {activeTab === 'teaching' && (
          <CoursesContainer data={this.props.courses} />
        )}
      </div>
    );
  }
}
