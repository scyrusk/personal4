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
        { courses }
      </div>
    )
  }
};