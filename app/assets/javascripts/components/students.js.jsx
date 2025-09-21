class StudentsContainer extends React.Component {
  render() {
    const currentStudents = this.props.currentStudents || [];
    const alums = this.props.alums || [];

    const renderStudent = (student, i) => (
      <div key={i} className="col-md-3">
        <img src={student.image} alt={`Profile photo of ${student.name}`} className="student-img" />
        <p className="student-name"><a href={student.link} className="student-link">{ student.name }</a></p>
        <p className="student-info">{ student.info }</p>
        <p className="student-years">{ student.years }</p>
        { student.now && <p className={`student-now ${student.alum ? "student-now-alum" : "student-now-market" }`}>{ student.now }</p> }
      </div>
    );

    return (
      <div>
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