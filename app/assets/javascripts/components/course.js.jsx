class CoursesContainer extends React.Component {
  render() {
    var courses = (this.props.data || []).slice().sort(function(a, b) {
      // Sort by most recent semester first
      return (b.semester || "").localeCompare(a.semester || "");
    });

    return (
      <div className="teaching-list">
        {courses.map(function(course, index) {
          return (
            <div key={index} className="teaching-item">
              <div className="teaching-code">{course.courseCode}</div>
              <div className="teaching-name">
                {course.link ? (
                  <a href={course.link} target="_blank">{course.courseName}</a>
                ) : (
                  course.courseName
                )}
              </div>
              <div className="teaching-meta">{course.semester}</div>
            </div>
          );
        })}
      </div>
    );
  }
}
