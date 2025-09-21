class MainContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentFilter: null
    };
    this.handleStudentFilter = this.handleStudentFilter.bind(this);
  }

  handleStudentFilter(studentName) {
    this.setState({ studentFilter: studentName });
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-6">
          <div id="about-content">
            {/* About content will be rendered by the server in this div */}
          </div>
          <hr />
          <StudentsContainer 
            currentStudents={this.props.currentStudents} 
            alums={this.props.alums}
            onStudentFilter={this.handleStudentFilter}
          />
        </div>
        <div className="col-md-6">
          <TabContainer 
            papersUrl={this.props.papersUrl}
            paperAssets={this.props.paperAssets}
            paperPollInterval={this.props.paperPollInterval}
            awardsUrl={this.props.awardsUrl}
            courses={this.props.courses}
            studentFilter={this.state.studentFilter}
          />
        </div>
      </div>
    );
  }
}
