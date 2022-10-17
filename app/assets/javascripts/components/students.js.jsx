var StudentsContainer = React.createClass({
  render: function() {
    const studentNodes = this.props.students.map(function(student, i) {
      return (
        <div className="col-md-2">
        
              <img src={student.image} alt={`Profile photo of ${student.name}`} className="student-img" />
              <p className="student-name"><a href={student.link} className="student-link">{ student.name }</a></p>
              <p className="student-info">{ student.info }</p>
        </div>
      )
    });

    return (
      <div className="row">
        <div className="col-xs-12">
          <p className="student-header">
            Ph.D. Students
          </p>
        </div>
        { studentNodes }
      </div>
    );
  }
})