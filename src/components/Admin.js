import React from 'react';
import { Scaler } from "dapparatus";
import Blockies from 'react-blockies';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
const QRCode = require('qrcode.react');

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  }
  render(){
    let {mainStyle,contracts,tx,web3} = this.props

    return (
      <div className="main-card card w-100">

        <div className="content bridge row">
          <div className="col-1 p-1">
            <Blockies seed={this.state.newVendor} scale={5}/>
          </div>
          <div className="col-3 p-1">
            <input type="text" className="form-control" placeholder="0x..." value={this.state.newVendor}
                   onChange={event => this.setState({newVendor:event.target.value})} />
          </div>
          <div className="col-4 p-1">
            <input type="text" className="form-control" placeholder="Joe's Pizza" value={this.state.newVendorName}
                   onChange={event => this.setState({newVendorName:event.target.value})} />
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}} onClick={()=>{
            tx(contracts.DenDai.addVendor(this.state.newVendor,web3.utils.utf8ToHex(this.state.newVendorName)),(result)=>{
              console.log("VENDOR ADDED",result)
              this.setState({newVendor:"",newVendorName:""})
            })
          }}>
            <Scaler config={{startZoomAt:500,origin:"40% 50%"}}>
              <i className="fas fa-user"></i> Add Vendor
            </Scaler>
          </button>
          </div>
        </div>

        <div className="content bridge row">
          <div className="col-1 p-1">
            <Blockies seed={this.state.newAdmin} scale={5}/>
          </div>
          <div className="col-7 p-1">
            <input type="text" className="form-control" placeholder="0x..." value={this.state.newAdmin}
                   onChange={event => this.setState({newAdmin:event.target.value})} />
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}} onClick={()=>{
            tx(contracts.DenDai.updateAdmin(this.state.newAdmin,true),(result)=>{
              console.log("ADMIN ADDED",result)
              this.setState({newAdmin:""})
            })
          }}>
            <Scaler config={{startZoomAt:500,origin:"40% 50%"}}>
              <i className="fas fa-user-astronaut"></i> Add Admin
            </Scaler>
          </button>
          </div>
        </div>

      </div>
    )
  }
}
