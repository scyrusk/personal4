function getInitials(name) {
  return (name || "").split(" ").map(function(w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
}

class StudentsContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeStudent: null };
    this.handleStudentClick = this.handleStudentClick.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.isInternalChange = false;
  }

  componentDidMount() {
    window.addEventListener('searchFilterChanged', this.handleSearchChange);
  }

  componentWillUnmount() {
    window.removeEventListener('searchFilterChanged', this.handleSearchChange);
  }

  handleSearchChange(event) {
    if (this.isInternalChange) {
      this.isInternalChange = false;
      return;
    }
    var searchTerm = event.detail.searchTerm || "";
    this.updateActiveStudentFromSearch(searchTerm);
  }

  updateActiveStudentFromSearch(searchTerm) {
    var allStudents = [].concat(this.props.currentStudents || [], this.props.alums || []);
    var matchingStudent = null;
    if (searchTerm.trim() !== "") {
      matchingStudent = allStudents.find(function(s) {
        return s.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    var newActive = matchingStudent ? matchingStudent.name : null;
    if (newActive !== this.state.activeStudent) {
      this.setState({ activeStudent: newActive });
    }
  }

  handleStudentClick(studentName, e) {
    e.preventDefault();
    e.stopPropagation();
    var newActive = this.state.activeStudent === studentName ? null : studentName;
    this.setState({ activeStudent: newActive });
    this.isInternalChange = true;
    window.dispatchEvent(new CustomEvent('studentFilterChanged', {
      detail: { studentName: newActive }
    }));
  }

  render() {
    var currentStudents = this.props.currentStudents || [];
    var alums = this.props.alums || [];
    var activeStudent = this.state.activeStudent;
    var handleStudentClick = this.handleStudentClick.bind(this);

    var renderStudent = function(student, i) {
      var isActive = activeStudent === student.name;
      return (
        <div key={i} className={'student-card' + (isActive ? ' active' : '')}
          onClick={function(e) { handleStudentClick(student.name, e); }}>
          <div className="student-avatar">
            {student.image ? (
              <img src={student.image} alt={student.name} />
            ) : (
              getInitials(student.name)
            )}
          </div>
          <div className="student-card-name">
            {student.link ? (
              <a href={student.link} onClick={function(e) { e.stopPropagation(); }}>
                {student.name}
              </a>
            ) : student.name}
          </div>
          {student.info && <div className="student-card-topic">{student.info}</div>}
          {student.years && <div className="student-card-meta">{student.years}</div>}
          {student.now && <div className="student-card-meta" style={{fontStyle:'italic'}}>{student.now}</div>}
        </div>
      );
    };

    return (
      <div className={'students-section' + (activeStudent ? ' has-active' : '')}>
        <div className="students-section-head">Current Ph.D. Students &amp; Post-Docs</div>
        <div className="students-grid">
          {currentStudents.map(renderStudent)}
        </div>

        {alums.length > 0 && (
          <div style={{marginTop: 32}}>
            <div className="students-section-head">Alumni</div>
            <div className="students-grid">
              {alums.map(renderStudent)}
            </div>
          </div>
        )}
      </div>
    );
  }
}
