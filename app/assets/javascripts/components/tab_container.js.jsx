class TabContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'publications', // Default to publications tab
      studentFilter: null
    };
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleStudentFilter = this.handleStudentFilter.bind(this);
  }

  handleTabClick(tabName) {
    this.setState({ activeTab: tabName });
  }

  handleStudentFilter(studentName) {
    this.setState({ studentFilter: studentName });
  }

  render() {
    const { activeTab } = this.state;
    
    return (
      <div className="tab-container">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" role="tablist">
          <li role="presentation" className={activeTab === 'publications' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); this.handleTabClick('publications'); }}
              role="tab"
              aria-selected={activeTab === 'publications'}
            >
              Selected Publications
            </a>
          </li>
          <li role="presentation" className={activeTab === 'awards' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); this.handleTabClick('awards'); }}
              role="tab"
              aria-selected={activeTab === 'awards'}
            >
              Honors & Awards
            </a>
          </li>
          <li role="presentation" className={activeTab === 'teaching' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); this.handleTabClick('teaching'); }}
              role="tab"
              aria-selected={activeTab === 'teaching'}
            >
              Teaching
            </a>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'publications' && (
            <div className="tab-pane active">
              <PaperContainer 
                url={this.props.papersUrl} 
                assets={this.props.paperAssets} 
                pollInterval={this.props.paperPollInterval}
                studentFilter={this.props.studentFilter}
                currentStudents={this.props.currentStudents}
                alums={this.props.alums}
              />
            </div>
          )}
          
          {activeTab === 'awards' && (
            <div className="tab-pane active">
              <AwardContainer url={this.props.awardsUrl} />
            </div>
          )}
          
          {activeTab === 'teaching' && (
            <div className="tab-pane active">
              <CoursesContainer data={this.props.courses} />
            </div>
          )}
        </div>
      </div>
    );
  }
}
