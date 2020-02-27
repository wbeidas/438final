import React, {Component} from 'react';
import Calculator from "./components/Calculator";
import InfoAboutApp from "./components/InfoAboutApp";
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <InfoAboutApp/>
        <div id="wrapper">
          <div id="calculator-wrapper">
            <Calculator/>
          </div>
        </div>
      </div>);
  }
}

export default App;