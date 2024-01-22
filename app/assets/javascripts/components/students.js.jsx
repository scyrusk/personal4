class StudentsContainer extends React.Component {
  render() {
    const studentNodes = this.props.students.map(function(student, i) {
      return (
        <div className="col-md-3">
          <img src={student.image} alt={`Profile photo of ${student.name}`} className="student-img" />
          <p className="student-name"><a href={student.link} className="student-link">{ student.name }</a></p>
          <p className="student-info">{ student.info }</p>
          <p className="student-years">{ student.years }</p>
          { student.now && <p className={`student-now ${student.alum ? "student-now-alum" : "student-now-market" }`}>{ student.now }</p> }
        </div>
      )
    });

    return (
      <div className="row">
        <div className="col-xs-12">
          <p className="student-header">
            Ph.D. Students, Post-Docs, and Alum
          </p>
        </div>
        { studentNodes }
      </div>
    );
  }
};