import React from 'react';
import { Blockie } from "dapparatus";
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import { Box, Flex, Text, Image, Icon } from "rimble-ui";

export default ({dollarDisplay, view, max, buttonStyle, ERC20TOKEN, vendorName, address, recentTxs, block, changeView}) => {
  let txns = []
  let count=0
  if(!max) max=9999
  for(let r in recentTxs){
    let thisValue = parseFloat(recentTxs[r].value)
    if(thisValue>0.0){

      let extraUp = 0
      if(view=="receive"){
        extraUp=-10
      }
      let extraIcon = ""


      let dollarView
      if(ERC20TOKEN){
        if(recentTxs[r].token){
          dollarView = (
            <Text color={'gray'}>
              <span style={{opacity:0.33}}>-</span>{dollarDisplay(recentTxs[r].value)}<span style={{opacity:0.33}}>-></span>
            </Text>
          )
        }else{
          dollarView = (
            <Text color={'gray'}>
              {dollarDisplay(recentTxs[r].value)}
            </Text>
          )
        }

      } else {
        //dollarDisplay
        dollarView = (
          <Text color={'gray'}>
            <span style={{opacity:0.33}}>-</span>{dollarDisplay(recentTxs[r].value)}<span style={{opacity:0.33}}>-></span>
          </Text>
        )
      }

      let toBlockie = (
        <Blockie
          address={recentTxs[r].to}
          config={{size:4}}
        />
      )
      if(recentTxs[r].to==address && recentTxs[r].data) {
        let message = recentTxs[r].data
        let limit = 18
        if(message.length>limit){
          message = message.substring(0,limit-3)+"..."
        }
        toBlockie = (
          <span style={{fontSize:14}}>
            {message}
          </span>
        )
      }

      if(count++<max){
        //if(txns.length>0){
          txns.push(
            <hr key={"ruler"+recentTxs[r].hash} style={{ "color": "#DFDFDF",marginTop:0,marginBottom:7 }}/>
          )
        //}

        let blockAge = block-recentTxs[r].blockNumber
        if(!blockAge){blockAge=0}

        if(blockAge<=1&&recentTxs[r].to==address){
          txns.push(
            <Flex alignItems={'center'} justifyContent={'space-between'} py={3} key={recentTxs[r].hash}>
              <Icon name="CheckCircle" color={'success'} size={32} />

              <Blockie
                address={recentTxs[r].from}
                config={{size:4}}
              />

              {dollarView}

              {toBlockie}
            </Flex>
          )
        }else{
          txns.push(
            <Flex key={recentTxs[r].hash} alignItems={'center'} justifyContent={'space-between'} py={3}>
              {extraIcon}

              <Blockie
                address={recentTxs[r].from}
                config={{size:4}}
              />

              {dollarView}

              {toBlockie}

              <Text color={'gray'}>{cleanTime((blockAge)*5)} ago</Text>

            </Flex>
          )
        }


      }

    }
  }
  if(txns.length>0){
    return (
      <div style={{marginTop:30}}>
        {txns}
      </div>
    )
  }else{
    return (
      <span></span>
    )
  }
}

let cleanTime = (s)=>{
  if(s<60){
    return s+"s"
  }else if(s/60<60){
    return Math.round(s/6)/10+"m"
  }else {
    return Math.round((s/60/6)/24)/10+"d"
  }
}
