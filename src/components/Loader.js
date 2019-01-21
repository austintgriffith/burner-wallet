import React, { Component }  from 'react';
import ReactLoading from 'react-loading';
import burnerloader from '../burnerloader.gif';
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
    let newPercent = this.state.percent+4.75
    if(newPercent>100) newPercent=100
    this.setState({percent:newPercent})
  }
  render() {
    return (
      <div>
        <div style={{position:"relative",width:"70%",margin:'auto',marginTop:-50,opacity:0.1}}>
          <ReactLoading type="cylon" color={"#FFFFFF"} width={"100%"} />
          <div style={{position:"absolute",left:0,top:"200%",width:this.state.percent+"%",height:"120%",backgroundColor:"#FFFFFF",opacity:0.3}}>
          </div>
        </div>
        <img src ={burnerloader} style={{width:"100%",height:"100%",opacity:0.88}}/>
      </div>
    )
  }
}
export default App;
