var InputField = React.createClass({
  getInitialState: function() {
   return { value: this.props.value };
  },

  getValue: function() {
    return this.state.value;
  },

  handleChange: function() {
    this.setState({
      value: this.refs[this.props.name].value
    });
  },

  render: function() {
    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="col-xs-1 control-label">
          {this.props.name}
        </label>
        <div className="col-xs-offset-1 col-xs-10">
          <input
            type={this.props.type}
            value={this.state.value}
            ref={this.props.name}
            onChange={this.handleChange}
            className="form-control" />
        </div>
      </div>
    );
  }
});

var FileField = React.createClass({
  getInitialState: function() {
    return {
      value: null,
    };
  },

  getValue: function() {
    return this.state.value;
  },

  handleFile: function(e) {
    var self = this;
    var reader = new FileReader();
    var file = e.target.files[0];

    reader.onload = function(upload) {
      self.setState({
        value: upload.target.result,
      });
    }

    reader.readAsDataURL(file);
  },

  render: function() {
    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="col-xs-1 control-label">
          {this.props.name}
        </label>
        <div className="col-xs-offset-1 col-xs-10">
          <input
            type="file"
            ref={this.props.name}
            className="form-control"
            onChange={this.handleFile} />
        </div>
      </div>
    );
  }
});

var SelectField = React.createClass({
  getInitialState: function() {
    return { value: this.props.value };
  },

  getValue: function() {
    return this.state.value;
  },

  handleSelection: function(e) {
    this.setState({
      value: e.target.value
    });
  },

  render: function() {
    var optionNodes = this.props.options.map(function(option) {
      return (
        <option value={option.value} key={option.value}>
          {option.rendered}
        </option>
      );
    });

    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="col-xs-1 control-label">
          {this.props.name}
        </label>
        <div className="col-xs-offset-1 col-xs-10">
          <select
            ref={this.props.name}
            className="form-control"
            onChange={this.handleSelection}
            value={this.state.value}>
            {optionNodes}
          </select>
        </div>
      </div>
    );
  }
});


var SubmitButton = React.createClass({
  render: function() {
    return (
      <div className="form-group">
        <div className="col-xs-offset-2 col-xs-10">
          <button type="submit" className="btn btn-default">Save</button>
        </div>
      </div>
    );
  }
});


let Checkbox = React.createClass({
  getInitialState: function () {
    return {
      isChecked: this.props.checked
    };
  },

  getChecked: function() {
    return this.state.isChecked;
  },

  toggleCheckbox: function () {
    this.setState({
      isChecked: ! this.state.isChecked
    });

    // this.props.handleCheckboxChange(this.props.label);
  },

  render: function () {
    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="col-xs-1 control-label">
          {this.props.label}
        </label>
        <div className="col-xs-offset-1 col-xs-10">
            <input
              type="checkbox"
              value={this.props.label}
              checked={this.state.isChecked}
              ref={this.props.name}
              onChange={this.toggleCheckbox} />
        </div>
      </div>
    );
  }
});