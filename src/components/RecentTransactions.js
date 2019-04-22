import React from 'react';
import { withRouter } from 'react-router-dom';
import { Blockie } from "dapparatus";
import { withTransactionStore } from '../contexts/TransactionStore';
import { ERC20TOKEN } from '../config';
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import { dollarDisplay } from '../lib';

const RecentTransactions = ({
  max, buttonStyle, vendorName, address, block, changeView, recentTxs, fullRecentTxs, location
}) => {
  let txns = []
  let count=0
  const transactions = ERC20TOKEN ? fullRecentTxs : recentTxs;
  if(!max) max=9999
  for(const transaction of transactions){
    let thisValue = parseFloat(transaction.value)
    if(thisValue>0.0){

      let extraUp = 0
      if(location.pathname === "/receive"){
        extraUp=-10
      }
      let extraIcon = ""
      if(transaction.data){
        extraIcon = (
          <div style={{position:'absolute',right:-3,top:extraUp}}>
            <button className="btn btn-large w-100" style={buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-comment"></i>
              </Scaler>
            </button>
          </div>
        )
      }else{
        extraIcon = (
          <div style={{position:'absolute',right:-3,top:extraUp}}>
            <button className="btn btn-large w-100" style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-comment"></i>
              </Scaler>
            </button>
          </div>
        )
      }

      let dollarView
      if(ERC20TOKEN){
        if(transaction.token){
          dollarView = (
            <span>
              <span style={{opacity:0.33}}>-</span>{dollarDisplay(transaction.value)}<span style={{opacity:0.33}}>-></span>
            </span>
          )
        }else{
          dollarView = (
            <span style={{opacity:0.5,fontSize:14}}>
              {dollarDisplay(transaction.value)}
            </span>
          )
        }

      } else {
        //dollarDisplay
        dollarView = (
          <span>
            <span style={{opacity:0.33}}>-</span>{dollarDisplay(transaction.value)}<span style={{opacity:0.33}}>-></span>
          </span>
        )
      }

      let toBlockie = (
        <Blockie
          address={transaction.to}
          config={{size:4}}
        />
      )
      if(transaction.to==address && transaction.data) {
        let message = transaction.data
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
            <hr key={"ruler"+transaction.hash} style={{ "color": "#DFDFDF",marginTop:0,marginBottom:7 }}/>
          )
        //}

        let blockAge = block-transaction.blockNumber

        if(blockAge<=1&&transaction.to==address){
          txns.push(
            <div key={"green"+count} style={{position:'relative',cursor:'pointer',paddingTop:10,paddingBottom:10}} key={transaction.hash} className="content bridge row" onClick={()=>{
              if(transaction.from==address){
                changeView(`account/${transaction.to}`)
              }else{
                changeView(`account/${transaction.from}`)
              }
            }}>
              <div className="col-3" style={{textAlign:'center'}}>
                <i className="fas fa-check-circle" style={{color:"#39e917",fontSize:70,opacity:.7}}></i>
              </div>
              <div className="col-3" style={{textAlign:'center',paddingTop:6}}>
                <Blockie
                  address={transaction.from}
                  config={{size:7}}
                />
              </div>
              <div className="col-3" style={{textAlign:'center',paddingTop:15,whiteSpace:"nowrap",letterSpacing:-1}}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  {dollarView}
                </Scaler>
              </div>
              <div className="col-3" style={{textAlign:'center',paddingTop:15,whiteSpace:"nowrap",letterSpacing:-1}}>
                {toBlockie}
              </div>
            </div>
          )
        }else{
          txns.push(
            <div style={{position:'relative',cursor:'pointer'}} key={transaction.hash} className="content bridge row" onClick={()=>{
              if(transaction.from==address){
                changeView(`account/${transaction.to}`)
              }else{
                changeView(`account/${transaction.from}`)
              }
            }}>
              {extraIcon}
              <div className="col-3 p-1" style={{textAlign:'center'}}>
                <Blockie
                  address={transaction.from}
                  config={{size:4}}
                />
              </div>
              <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <Scaler config={{startZoomAt:600,origin:"25% 50%",adjustedZoom:1}}>
                  {dollarView}
                </Scaler>
              </div>
              <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                {toBlockie}
              </div>
              <div className="col-2 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <Scaler config={{startZoomAt:600,origin:"25% 50%",adjustedZoom:1}}>
                <span style={{marginLeft:5,marginTop:-5,opacity:0.4,fontSize:12}}>{cleanTime((blockAge)*5)} ago</span>
                </Scaler>
              </div>

            </div>
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

export default withRouter(withTransactionStore(RecentTransactions));
