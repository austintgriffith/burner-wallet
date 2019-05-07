import React, { Component }  from 'react';
import { Flex, Box } from "rimble-ui";

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
      <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
        { this.props.loaderImage ? (
          <Box my={4} textAlign={'center'}>
            <img src ={this.props.loaderImage} style={{maxWidth:"25%",paddingBottom:"5%"}}/>
          </Box>
          ) : null
        }
        
        <div style={{width:"80%",height:1,backgroundColor:"#444444"}}>
          <div style={{width:this.state.percent+"%",height:1,backgroundColor:this.props.mainStyle.mainColorAlt,boxShadow:"0 0 "+shadowAmount/40+"px "+shadowColor+", 0 0 "+shadowAmount/30+"px "+shadowColor+", 0 0 "+shadowAmount/20+"px "+shadowColor+", 0 0 "+shadowAmount/10+"px #ffffff, 0 0 "+shadowAmount/5+"px "+shadowColor+", 0 0 "+shadowAmount/3+"px "+shadowColor+", 0 0 "+shadowAmount/1+"px "+shadowColor+""}}>
          </div>
        </div>
      </Flex>
    )
  }
}
export default App;
