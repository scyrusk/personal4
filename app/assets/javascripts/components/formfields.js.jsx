class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
    this.getValue = this.getValue.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  getValue() {
    return this.state.value;
  }

  handleChange() {
    this.setState({
      value: this.refs[this.props.name].value
    });
  }

  render() {
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
};

class FileField extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
    this.getValue = this.getValue.bind(this);
    this.handleFile = this.handleFile.bind(this);
  }

  getValue() {
    return this.state.value;
  }

  handleFile(e) {
    var self = this;
    var reader = new FileReader();
    var file = e.target.files[0];

    reader.onload = function(upload) {
      self.setState({
        value: upload.target.result,
      });
    }

    reader.readAsDataURL(file);
  }

  render() {
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
};

class SelectField extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
    this.getValue = this.getValue.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }

  getValue() {
    return this.state.value;
  }

  handleSelection(e) {
    this.setState({
      value: e.target.value
    });
  }

  render() {
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
};


class SubmitButton extends React.Component {
  render() {
    return (
      <div className="form-group">
        <div className="col-xs-offset-2 col-xs-10">
          <button type="submit" className="btn btn-default">Save</button>
        </div>
      </div>
    );
  }
};

class Checkbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isChecked: this.props.checked };
    this.getChecked = this.getChecked.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
  }

  getChecked() {
    return this.state.isChecked;
  }

  toggleCheckbox() {
    this.setState({
      isChecked: ! this.state.isChecked
    });

    // this.props.handleCheckboxChange(this.props.label);
  }

  render() {
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
};