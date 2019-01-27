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

    let shadowAmount = 100
    let shadowColor = this.props.mainStyle.mainColor
    return (
      <div style={{textAlign:'center'}}>
        <div style={{width:"100%",paddingTop:"35%"}}>
        </div>
        <div style={{width:"90%",height:1,backgroundColor:"#444444",marginLeft:"5%"}}>
          <div style={{width:this.state.percent+"%",height:1,backgroundColor:this.props.mainStyle.mainColorAlt,boxShadow:"0 0 "+shadowAmount/40+"px "+shadowColor+", 0 0 "+shadowAmount/30+"px "+shadowColor+", 0 0 "+shadowAmount/20+"px "+shadowColor+", 0 0 "+shadowAmount/10+"px #ffffff, 0 0 "+shadowAmount/5+"px "+shadowColor+", 0 0 "+shadowAmount/3+"px "+shadowColor+", 0 0 "+shadowAmount/1+"px "+shadowColor+""}}>
          </div>
        </div>
      </div>
    )
  }
}
export default App;


/*

.glow {
  color: #fff;
  text-align: center;
  text-shadow: 0 0 20px #fff, 0 0 30px #ffffff, 0 0 40px #ffffff, 0 0 50px #ffffff, 0 0 60px #ffffff, 0 0 70px #ffffff, 0 0 80px #ffffff;
}

<img src ={burnerloader} style={{width:"75%",height:"75%",maringTop:"40%",opacity:0.16}}/>
<div style={{position:"relative",width:"100%",hegiht:"100%",margin:'auto',marginTop:"-50%",opacity:0.07}}>
  <ReactLoading type="cylon" color={"#FFFFFF"} width={"100%"} />
  <div style={{position:"absolute",left:0,top:"200%",width:this.state.percent+"%",height:"300%",backgroundColor:"#FFFFFF",opacity:0.3}}>
  </div>
</div>
*/
