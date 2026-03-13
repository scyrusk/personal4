class CoursesContainer extends React.Component {
  render() {
    const grouped = this.props.data.reduce(function(acc, course) {
      if (!acc[course.semester]) acc[course.semester] = [];
      acc[course.semester].push(course);
      return acc;
    }, {});

    function semValue(sem) {
      const parts = sem.split(' ');
      const year = parseInt(parts[1]);
      const order = parts[0].toLowerCase() === 'spring' ? 0 : parts[0].toLowerCase() === 'summer' ? 1 : 2;
      return year * 10 + order;
    }

    const knownValues = Object.keys(grouped).map(semValue);
    const minVal = Math.min(...knownValues);
    const maxVal = Math.max(...knownValues);

    // Generate every Spring + Fall in range, newest first
    const allSems = [];
    const minYear = Math.floor(minVal / 10);
    const maxYear = Math.floor(maxVal / 10);
    for (let year = maxYear; year >= minYear; year--) {
      [['Fall', 2], ['Spring', 0]].forEach(function(pair) {
        const val = year * 10 + pair[1];
        if (val >= minVal && val <= maxVal) {
          allSems.push({ semester: pair[0] + ' ' + year, value: val });
        }
      });
    }

    // Consolidate consecutive gaps into single entries
    const items = [];
    let i = 0;
    while (i < allSems.length) {
      const courses = grouped[allSems[i].semester];
      if (courses) {
        items.push({ type: 'semester', semester: allSems[i].semester, courses: courses });
        i++;
      } else {
        while (i < allSems.length && !grouped[allSems[i].semester]) i++;
        items.push({ type: 'gap' });
      }
    }

    const timelineNodes = items.map(function(item, idx) {
      if (item.type === 'gap') {
        return (
          <div key={'gap-' + idx} className="timeline-item timeline-gap">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-leave">Release / leave</span>
            </div>
          </div>
        );
      }
      return (
        <div key={item.semester} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="course-semester">{item.semester}</div>
            {item.courses.map(function(course, cidx) {
              return (
                <div key={cidx} className="course-item">
                  <a href={course.link} target="_blank">
                    <b>{course.courseCode}</b>: {course.courseName}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="courses-timeline">
        {timelineNodes}
      </div>
    );
  }
};
