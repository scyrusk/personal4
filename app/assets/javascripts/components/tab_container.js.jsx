class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'publications',
      papers: [],
      awards: [],
      filterText: '',
      timeoutVar: null
    };
    this._handleFilterClick = this._handleFilterClick.bind(this);
    this._handleFilterTextChanged = this._handleFilterTextChanged.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
  }

  componentDidMount() {
    this._loadPapers();
    this._loadAwards();

    // Sync from student filter → paper filter
    this._studentFilterListener = (event) => {
      this._handleFilterTextChanged(event.detail.studentName || '');
    };
    window.addEventListener('studentFilterChanged', this._studentFilterListener);
  }

  componentWillUnmount() {
    window.removeEventListener('studentFilterChanged', this._studentFilterListener);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.studentFilter !== this.props.studentFilter) {
      this._handleFilterTextChanged(this.props.studentFilter || '');
    }
  }

  _loadPapers() {
    $.ajax({
      url: this.props.papersUrl,
      dataType: 'json',
      cache: false,
      success: (data) => this.setState({ papers: data.reverse() }),
      error: (xhr, status, err) => console.error(this.props.papersUrl, status, err.toString())
    });
  }

  _loadAwards() {
    $.ajax({
      url: this.props.awardsUrl,
      dataType: 'json',
      cache: false,
      success: (data) => this.setState({ awards: data }),
      error: (xhr, status, err) => console.error(this.props.awardsUrl, status, err.toString())
    });
  }

  _handleFilterClick(e) {
    this._handleFilterTextChanged(e.target.innerText);
    $('html,body').animate({ scrollTop: 0 });
  }

  _handleFilterTextChanged(ft) {
    if (this.state.timeoutVar) clearTimeout(this.state.timeoutVar);
    var tv = ft !== '' ? setTimeout(() => gaSendEvent('Interaction', 'Search', ft), 5000) : null;
    this.setState({ filterText: ft, timeoutVar: tv });
    window.dispatchEvent(new CustomEvent('searchFilterChanged', { detail: { searchTerm: ft } }));
  }

  handleTabClick(tabName) {
    this.setState({ activeTab: tabName });
  }

  // ─── Publications timeline ───────────────────────────────────────────────
  _paperNode(paper, assets, filterClickListener, selected) {
    var noThumb = assets['noThumb'];
    return (
      <Paper
        key={randomString(8)}
        handleFilterClick={filterClickListener}
        selected={selected !== undefined ? selected : paper.selected}
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
        tags={paper.tags || ''}
        tweets={paper.tweets}
        assets={assets}
        id={paper.id}
      />
    );
  }

  _groupByYear(papers) {
    var grouped = {};
    papers.forEach(function(p) {
      if (!grouped[p.year]) grouped[p.year] = [];
      grouped[p.year].push(p);
    });
    return grouped;
  }

  _timelineItems(grouped, assets, filterClickListener, selectedOverride) {
    var self = this;
    var years = Object.keys(grouped).map(Number).sort(function(a, b) { return b - a; });
    return years.map(function(year) {
      return (
        <div key={year} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-year-label">{year}</div>
            {grouped[year].map(function(paper) {
              return self._paperNode(paper, assets, filterClickListener, selectedOverride);
            })}
          </div>
        </div>
      );
    });
  }

  _publicationsTimeline() {
    var self = this;
    var filterClickListener = this._handleFilterClick;
    var assets = this.props.paperAssets;

    function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    var ft = this.state.filterText.toLowerCase();
    var ftEsc = escapeRegExp(ft);

    var papers = this.state.papers.map(function(paper) {
      paper.selected = (
        ft === '' ||
        paper.title.toLowerCase().search(ftEsc) >= 0 ||
        paper.venue.toLowerCase().indexOf(ft) >= 0 ||
        paper.year.toString().indexOf(ft) >= 0 ||
        paper.authors.some(function(a) { return a.name.toLowerCase().search(ftEsc) >= 0; }) ||
        paper.awards.some(function(a) { return a.body.toLowerCase().search(ftEsc) >= 0; }) ||
        (paper.tags || '').toLowerCase().search(ftEsc) >= 0
      );
      return paper;
    });

    // No filter: plain chronological timeline
    if (ft === '') {
      return this._timelineItems(this._groupByYear(papers), assets, filterClickListener);
    }

    // Filter active: matches float to top, full timeline grayed below
    var matched = papers.filter(function(p) { return p.selected; });
    var matchedGrouped = this._groupByYear(matched);

    return (
      <div>
        {matched.length === 0 && (
          <p className="timeline-no-results">No publications matched your search.</p>
        )}
        {this._timelineItems(matchedGrouped, assets, filterClickListener, true)}
        {matched.length > 0 && (
          <div className="timeline-context-divider">
            <span>All publications</span>
          </div>
        )}
        <div className="timeline-context">
          {this._timelineItems(this._groupByYear(papers), assets, filterClickListener, false)}
        </div>
      </div>
    );
  }

  // ─── Awards timeline ─────────────────────────────────────────────────────
  _awardsTimeline() {
    var grouped = {};
    this.state.awards.forEach(function(award) {
      var y = award.year || 'Unknown';
      if (!grouped[y]) grouped[y] = [];
      grouped[y].push(award);
    });

    var years = Object.keys(grouped).sort(function(a, b) { return Number(b) - Number(a); });

    return years.map(function(year) {
      var sorted = grouped[year].slice().sort(function(a, b) {
        var pc = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return pc !== 0 ? pc : (a.id || 0) - (b.id || 0);
      });
      return (
        <div key={year} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-year-label">{year}</div>
            {sorted.map(function(award) {
              return (
                <Award
                  key={award.id}
                  text={award.body}
                  paper={award.paper}
                  pinned={award.pinned}
                />
              );
            })}
          </div>
        </div>
      );
    });
  }

  // ─── Teaching timeline ───────────────────────────────────────────────────
  _teachingTimeline() {
    var courses = this.props.courses;
    var grouped = {};
    courses.forEach(function(course) {
      if (!grouped[course.semester]) grouped[course.semester] = [];
      grouped[course.semester].push(course);
    });

    function semValue(sem) {
      var parts = sem.split(' ');
      var year = parseInt(parts[1]);
      var order = parts[0].toLowerCase() === 'spring' ? 0 : parts[0].toLowerCase() === 'summer' ? 1 : 2;
      return year * 10 + order;
    }

    var knownValues = Object.keys(grouped).map(semValue);
    var minVal = Math.min.apply(null, knownValues);
    var maxVal = Math.max.apply(null, knownValues);
    var minYear = Math.floor(minVal / 10);
    var maxYear = Math.floor(maxVal / 10);

    var allSems = [];
    for (var year = maxYear; year >= minYear; year--) {
      [['Fall', 2], ['Spring', 0]].forEach(function(pair) {
        var val = year * 10 + pair[1];
        if (val >= minVal && val <= maxVal) {
          allSems.push({ semester: pair[0] + ' ' + year, value: val });
        }
      });
    }

    var items = [];
    var i = 0;
    while (i < allSems.length) {
      var semCourses = grouped[allSems[i].semester];
      if (semCourses) {
        items.push({ type: 'semester', semester: allSems[i].semester, courses: semCourses });
        i++;
      } else {
        while (i < allSems.length && !grouped[allSems[i].semester]) i++;
        items.push({ type: 'gap' });
      }
    }

    return items.map(function(item, idx) {
      if (item.type === 'gap') {
        return (
          <div key={'gap-' + idx} className="timeline-item timeline-gap">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-leave">Release / leave</span>
            </div>
          </div>
        );
      }
      return (
        <div key={item.semester} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-year-label">{item.semester}</div>
            {item.courses.map(function(course, cidx) {
              return (
                <div key={cidx} className="course-item">
                  <a href={course.link} target="_blank">
                    <b>{course.courseCode}</b>: {course.courseName}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  }

  render() {
    var self = this;
    var activeTab = this.state.activeTab;
    var filterText = this.state.filterText;

    var tabs = [
      { id: 'publications', label: 'Publications' },
      { id: 'awards',       label: 'Honors & Awards' },
      { id: 'teaching',     label: 'Teaching' }
    ];

    return (
      <div className="unified-timeline-container">
        <div className="timeline-tab-switcher">
          {tabs.map(function(tab) {
            return (
              <button
                key={tab.id}
                className={'timeline-tab-btn' + (activeTab === tab.id ? ' active' : '')}
                onClick={function() { self.handleTabClick(tab.id); }}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'publications' && (
          <div className="timeline-search">
            <input
              type="text"
              placeholder="Search by title, author, venue, tag, or award"
              className="form-control paperFilter"
              value={filterText}
              onChange={function(e) { self._handleFilterTextChanged(e.target.value); }}
            />
          </div>
        )}

        <div className="courses-timeline">
          {activeTab === 'publications' && this._publicationsTimeline()}
          {activeTab === 'awards'       && this._awardsTimeline()}
          {activeTab === 'teaching'     && this._teachingTimeline()}
        </div>
      </div>
    );
  }
}
