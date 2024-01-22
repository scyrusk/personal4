class CoursesContainer extends React.Component {
  render() {
    const courses = this.props.data.map(function(course, index) {
      return (
        <div className="course-container col-md-3">
          <div className="course-semester">
            { course.semester }
          </div>
          <div className="course-name-link">
            <a href={course.link} target="_blank"><b>{ course.courseCode }</b>: { course.courseName }</a>
          </div>
        </div>
      );
    })

    return (
      <div className="row">
        <div className="col col-md-12">
          <p className="teaching-header">
            <i className="glypicon glyphicon-"/>
              Teaching
          </p>
        </div>
        { courses }
      </div>
    )
  }
};