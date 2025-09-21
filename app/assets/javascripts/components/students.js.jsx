class StudentsContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStudent: null
    };
    this.handleStudentClick = this.handleStudentClick.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.isInternalChange = false;
  }

  componentDidMount() {
    // Listen for search changes from the paper filter
    window.addEventListener('searchFilterChanged', this.handleSearchChange);
  }

  componentWillUnmount() {
    // Clean up event listener
    window.removeEventListener('searchFilterChanged', this.handleSearchChange);
  }

  handleSearchChange(event) {
    // Ignore search changes that come from our own student clicks
    if (this.isInternalChange) {
      this.isInternalChange = false;
      return;
    }
    
    const searchTerm = event.detail.searchTerm || "";
    this.updateActiveStudentFromSearch(searchTerm);
  }

  updateActiveStudentFromSearch(searchTerm) {
    const allStudents = [...(this.props.currentStudents || []), ...(this.props.alums || [])];
    
    // Only match if search term is not empty and contains a student name
    let matchingStudent = null;
    if (searchTerm.trim() !== "") {
      matchingStudent = allStudents.find(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const newActiveStudent = matchingStudent ? matchingStudent.name : null;
    
    if (newActiveStudent !== this.state.activeStudent) {
      this.setState({ activeStudent: newActiveStudent });
    }
  }

  handleStudentClick(studentName, e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle active student
    const newActiveStudent = this.state.activeStudent === studentName ? null : studentName;
    this.setState({ activeStudent: newActiveStudent });
    
    // Set flag to ignore the search change event that will be triggered
    this.isInternalChange = true;
    
    // Dispatch custom event for global communication
    const event = new CustomEvent('studentFilterChanged', { 
      detail: { studentName: newActiveStudent } 
    });
    window.dispatchEvent(event);
  }

  render() {
    const currentStudents = this.props.currentStudents || [];
    const alums = this.props.alums || [];
    const { activeStudent } = this.state;

    const renderStudent = (student, i) => {
      const isActive = activeStudent === student.name;
      const studentClass = `col-md-3 student-item ${isActive ? 'active' : ''}`;
      
      return (
        <div key={i} className={studentClass} onClick={(e) => this.handleStudentClick(student.name, e)}>
          <img src={student.image} alt={`Profile photo of ${student.name}`} className="student-img" />
          <p className="student-name">
            <a href={student.link} className="student-link" onClick={(e) => e.stopPropagation()}>
              { student.name }
            </a>
          </p>
          <p className="student-info">{ student.info }</p>
          <p className="student-years">{ student.years }</p>
          { student.now && <p className={`student-now ${student.alum ? "student-now-alum" : "student-now-market" }`}>{ student.now }</p> }
        </div>
      );
    };

    return (
      <div className={`students-container ${activeStudent ? 'has-active' : ''}`}>
        {/* Current Students Section */}
        <div className="row">
          <div className="col-xs-12">
            <p className="student-header">
              Current Ph.D. Students and Post-Docs
            </p>
          </div>
          { currentStudents.map(renderStudent) }
        </div>

        {/* Alums Section */}
        { alums.length > 0 && (
          <div className="row" style={{ marginTop: '30px' }}>
            <div className="col-xs-12">
              <p className="student-header">
                Alumni
              </p>
            </div>
            { alums.map(renderStudent) }
          </div>
        )}
      </div>
    );
  }
};