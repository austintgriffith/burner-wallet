import React, { Component }  from 'react';
let interval
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      percent: 5,
    };
  }
  componentDidMount(){
    interval = setInterval(this.loadMore.bind(this),250)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  loadMore(){
    let newPercent = this.state.percent+3
    if(newPercent>100) newPercent=100
    this.setState({percent:newPercent})
  }
  render() {
    return (
      <div className="loader">
        <img src ={this.props.loaderImage} className="loader__logo" alt=""/>
        <div className="loader__progress">
          <div className="loader__progress_fill" style={{width:this.state.percent+"%"}}/>
        </div>
      </div>
    )
  }
}
export default App;
