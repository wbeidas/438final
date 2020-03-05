import React, {Component} from 'react';
import { evaluate } from 'mathjs'; // eval is a reserved word!

/* Constants */
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const operators = ['/', '*', '-', '+', '='];

/* Only 6 characters can be displayed at the optimal full size.
If the character string is longer, we need to scale the display down */
const maxCharsAtFullSize = 6;
const scaleFactor = 'scale(0.36)';

/* Allow maximum of 16 digits afterthe decimal point */
const maxPrecision = 16;

/* Components */
function CalculatorDisplay(props) {
  const value = props.value;
  const pointAt = `${value}`.indexOf('.');
  const decimalValue = value.substring(pointAt, evaluate(value.length));
  const precisionWithFraction = (pointAt === -1 )?0:evaluate(decimalValue.length - 1);
  let formattedValue = null;
  let scientificNotation = null;
  let scaleDown = null;

  formattedValue = parseFloat(value).toLocaleString(undefined, {minimumFractionDigits: precisionWithFraction}); // take the default locale formatting
  if (formattedValue === 'NaN') { //account for errors
    formattedValue = 'Error';
  } else {
    if (formattedValue.length > (maxPrecision - 1)) {
      scientificNotation = parseFloat(value).toExponential(maxPrecision - 4); // Allow at least 4 characters (for scientific notation e.g. e+14) in the output string
      if (scientificNotation.substring(scientificNotation.length - 3, scientificNotation.length) === 'e+0') { // if exponent part is not needed
        scientificNotation = parseFloat(value).toExponential(maxPrecision - 1 );
        scientificNotation = scientificNotation.substring(0, scientificNotation.length - 3)
      }
      formattedValue = scientificNotation;
      if (formattedValue === 'NaN') { //account for overflow
        formattedValue = 'Overflow\xA0Error';
      }
    }
  }
  scaleDown = (`${formattedValue}`.length) > maxCharsAtFullSize ? scaleFactor : 'scale(1)';
  return (
    <div className="calculator-display">
      <div className="auto-scaling-text" style={{transform: scaleDown}}>
        {formattedValue}
        </div>
      </div>
    );
}

class Calculator extends Component {
  constructor(props) {
    super(props); 

    this.state = {
      displayValue: '0',
      operator: null,
      waitingForOperand: false,
      firstOperand: '0',
      clearAll: true
    };
    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  
  processDigit(newKeyValue) {
    const { displayValue, waitingForOperand } = this.state;

    if (waitingForOperand) {
      this.setState({displayValue: `${newKeyValue}`, waitingForOperand: false, clearAll: false});
    } else {
      let newDisplayValue = (displayValue === '0')?`${newKeyValue}`:`${(displayValue)}${newKeyValue}`; //no leading zero
      this.setState({displayValue: `${newDisplayValue}`, waitingForOperand: false, clearAll: false});
    }
  }

  processOperator(newKeyValue) {
    const { displayValue, operator, waitingForOperand, firstOperand } = this.state;
    let newDisplayValue = null;
    let newOperator = null;
    let stringToEvaluate = null;

    if (firstOperand === '0' || operator == null || waitingForOperand) { // if not ready to do calculation
      this.setState({waitingForOperand: true, firstOperand: displayValue, operator: newKeyValue, clearAll: false});
      return;
    } else {
      stringToEvaluate = `${firstOperand}${operator}${displayValue}`;
      try {
        newDisplayValue = `${evaluate(stringToEvaluate)}`
      } catch (e) {
        newDisplayValue = 'Error';
      }
      if (newDisplayValue === "Infinity") { //math.js evaluates division by 0 to be "Infinity"
        newDisplayValue = 'Error';
      }
      newOperator = (newKeyValue === "=")? null: newKeyValue;
      this.setState({displayValue: `${newDisplayValue}`, waitingForOperand: true, firstOperand: `${newDisplayValue}`, operator: newOperator, clearAll: false})
    }
  }

  processPoint(newKeyValue) {
    const { displayValue, waitingForOperand } = this.state;
    const needPoint = `${displayValue}`.indexOf('.')===-1?true:false;
    let newDisplayValue = null;

    if (waitingForOperand) { // allow point if starting on a new operand
      this.setState({displayValue: '0.', waitingForOperand: false, clearAll: false})
    } else {
      if (needPoint) { //if not inputting new operand, only allow point if it's not already present
        newDisplayValue = `${displayValue}${newKeyValue}`;
        this.setState({displayValue: `${newDisplayValue}`, waitingForOperand: false, clearAll: false})
      }
    }
  }

  processPercentage(newKeyValue) {
    const { displayValue } = this.state;
    const newDisplayValue = parseFloat(displayValue).toPrecision(maxPrecision) / 100;
    this.setState({displayValue: `${newDisplayValue}`, waitingForOperand: false, clearAll: false});
  }

  processPlusMinusToggle(newKeyValue) {
    const { displayValue } = this.state;
    const newDisplayValue = parseFloat(displayValue).toPrecision(maxPrecision) * -1
    this.setState({displayValue: `${newDisplayValue}`, waitingForOperand: false, clearAll: false})
  }

  processClear() {
    const { clearAll } = this.state;
    console.log('clearAll', clearAll);
    if ( clearAll ) {
      this.setState({displayValue: '0', firstOperand: '0', operator: null, waitingForOperand: false, clearAll: true})
    } else {
      this.setState({displayValue: '0', clearAll: true})
    }
  }


  processUnknownKey(newKeyValue) {
    /* don't do anything, just write the error to the console log */
    console.log('Unexpected input: ', newKeyValue);
  }

  processFunctionKey(newKeyValue) {
    switch (newKeyValue) {
      case "C":
        this.processClear(newKeyValue);
        break;
      case "±":
        this.processPlusMinusToggle(newKeyValue);
        break;
      case ".":
        this.processPoint(newKeyValue);
        break;
      case "%":
        this.processPercentage(newKeyValue);
        break;
      default:
        this.processUnknownKey(newKeyValue);
    }
  }

  handleClick(e) {
    this.processNewKey(`${e.target.value}`);
  }

  processNewKey(newKeyValue) {
    const isDigit = digits.includes(newKeyValue);
    const isOperator = operators.includes(newKeyValue);

    if (isDigit) {
      this.processDigit(newKeyValue);
    } else {
      if (isOperator) {
        this.processOperator(newKeyValue);
      } else {
        this.processFunctionKey(newKeyValue);
      }
    }
  }

  render() {
    return (<div className="calculator">
      <CalculatorDisplay value={this.state.displayValue}/>

      <div className="calculator-keypad">
        <div className="input-keys">
          <div className="function-keys">
            <button id="key-clear" value="C" className="calculator-key key-clear" onClick={this.handleClick}>{this.state.clearAll?'AC':'C'}</button>
            <button id="key-sign" value="±" className="calculator-key key-sign" onClick={this.handleClick}>&plusmn;</button>
            <button id="key-percent" value="%" className="calculator-key key-percent" onClick={this.handleClick}>%</button>
          </div>

          <div className="digit-keys">
            <button id="key-0" value="0" className="calculator-key key-0" onClick={this.handleClick}>0</button>
            <button id="key-dot" value="." className="calculator-key key-dot" onClick={this.handleClick}>&middot;</button>
            <button id="key-1" value="1" className="calculator-key key-1" onClick={this.handleClick}>1</button>
            <button id="key-2" value="2" className="calculator-key key-2" onClick={this.handleClick}>2</button>
            <button id="key-3" value="3" className="calculator-key key-3" onClick={this.handleClick}>3</button>
            <button id="key-4" value="4" className="calculator-key key-4" onClick={this.handleClick}>4</button>
            <button id="key-5" value="5" className="calculator-key key-5" onClick={this.handleClick}>5</button>
            <button id="key-6" value="6" className="calculator-key key-6" onClick={this.handleClick}>6</button>
            <button id="key-7" value="7" className="calculator-key key-7" onClick={this.handleClick}>7</button>
            <button id="key-8" value="8" className="calculator-key key-8" onClick={this.handleClick}>8</button>
            <button id="key-9" value="9" className="calculator-key key-9" onClick={this.handleClick}>9</button>
          </div>
        </div>

        <div className="operator-keys">
          <button id="key-divide" value="/" className="calculator-key key-divide" onClick={this.handleClick}>&divide;</button>
          <button id="key-multiply" value="*" className="calculator-key key-multiply" onClick={this.handleClick}>&times;</button>
          <button id="key-subtract" value="-" className="calculator-key key-subtract" onClick={this.handleClick}>&ndash;</button>
          <button id="key-add" value="+" className="calculator-key key-add" onClick={this.handleClick}>+</button>
          <button id="key-equals" value="=" className="calculator-key key-equals" onClick={this.handleClick}>=</button>
        </div>
      </div>
    </div>)
  }
}

export default Calculator;