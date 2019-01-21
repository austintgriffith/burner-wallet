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
    let newPercent = this.state.percent+3
    if(newPercent>100) newPercent=100
    this.setState({percent:newPercent})
  }
  render() {
    return (
      <div style={{textAlign:'center'}}>
        <img src ={burnerloader} style={{width:"75%",height:"75%",maringTop:"40%",opacity:0.16}}/>
        <div style={{position:"relative",width:"100%",hegiht:"100%",margin:'auto',marginTop:"-50%",opacity:0.07}}>
          <ReactLoading type="cylon" color={"#FFFFFF"} width={"100%"} />
          <div style={{position:"absolute",left:0,top:"200%",width:this.state.percent+"%",height:"300%",backgroundColor:"#FFFFFF",opacity:0.3}}>
          </div>
        </div>
        <div style={{height:400}}>
        </div>
      </div>
    )
  }
}
export default App;
