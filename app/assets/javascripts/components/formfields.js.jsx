class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value != null ? this.props.value : '' };
    this.handleChange = this.handleChange.bind(this);
  }

  getValue() { return this.state.value; }

  handleChange(e) {
    var value = e.target.value;
    this.setState({ value: value });
    if (this.props.onChange) this.props.onChange(value);
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
    this.handleFile = this.handleFile.bind(this);
  }

  handleFile(e) {
    var self = this;
    var reader = new FileReader();
    var file = e.target.files[0];
    reader.onload = function(upload) {
      if (self.props.onChange) self.props.onChange(upload.target.result);
    };
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
    this.handleSelection = this.handleSelection.bind(this);
  }

  handleSelection(e) {
    var value = e.target.value;
    this.setState({ value: value });
    if (this.props.onChange) this.props.onChange(value);
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
    this.state = { isChecked: !!this.props.checked };
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
  }

  toggleCheckbox() {
    var next = !this.state.isChecked;
    this.setState({ isChecked: next });
    if (this.props.onChange) this.props.onChange(next);
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
            onChange={this.toggleCheckbox} />
        </div>
      </div>
    );
  }
};