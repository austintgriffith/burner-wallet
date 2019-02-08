import React from 'react';
import { Scaler } from "dapparatus";
import Blockies from 'react-blockies';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';
const QRCode = require('qrcode.react');

let interval
let metaReceiptTracker = {}

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      changingAvailable: {}
    }
  }
  render(){
    let {dollarDisplay,buttonStyle,contracts,vendor,tx,web3} = this.props

    let products = []
    for(let p in this.props.products){
      let prod = this.props.products[p]
      if(prod.exists){

        //console.log(prod)

        let productAvailableDisplay = ""
        if(this.state.changingAvailable[p]){
          productAvailableDisplay = (
            <i className="fas fa-cog fa-spin"></i>
          )
        }else if(prod.isAvailable){
          productAvailableDisplay = (
            <i className="fas fa-eye"></i>
          )
        }else{
          productAvailableDisplay = (
            <i className="fas fa-eye-slash"></i>
          )
        }

        let productIsActive = (
          <button className="btn btn-large w-100"
            onClick={()=>{
              let changingAvailable = this.state.changingAvailable
              changingAvailable[p] = true
              this.setState({changingAvailable})
              //addProduct(uint256 id, bytes32 name, uint256 cost, bool isAvailable)
              console.log(prod.id,prod.name,prod.cost,prod.isAvailable)
              tx(contracts[this.props.ERC20VENDOR].addProduct(prod.id,prod.name,prod.cost,!prod.isAvailable),240000,0,0,(result)=>{
                console.log("===PRODUCT:",result)
                let changingAvailable = this.state.changingAvailable
                changingAvailable[p] = false

                this.setState({changingAvailable})
                setTimeout(this.poll.bind(this),444)
              })
            }}
            style={buttonStyle.secondary}>
            <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              {productAvailableDisplay}
            </Scaler>
          </button>
        )

        let available = (
          <i className="far fa-eye"></i>
        )
        if(!prod.isAvailable){
          available = (
            <i className="far fa-eye" style={{opacity:0.3}}></i>
          )
        }

        let opacity  =  1.0
        if(!prod.isAvailable){
          opacity = 0.5
        }

        products.push(
          <div key={p} className="content bridge row" style={{opacity}}>
            <div className="col-6 p-1">
              {web3.utils.hexToUtf8(prod.name)}
            </div>
            <div className="col-4 p-1">
              ${dollarDisplay(web3.utils.fromWei(prod.cost,'ether'))}
            </div>
            <div className="col-2 p-1">
              {productIsActive}
            </div>
          </div>
        )
      }
    }

    let venderButtonText = ""
    if(this.state.changingActive){
      venderButtonText = (
          <div>
            <i className="fas fa-cog fa-spin"></i> {i18n.t('vendor.updating')}
          </div>
      )
    }else if(vendor.isActive){
      venderButtonText = (
          <div>
            <i className="fas fa-thumbs-up"></i> {i18n.t('vendor.open')}
          </div>
      )
    }else{
      venderButtonText = (
        <div>
          <i className="fas fa-thumbs-down"></i> {i18n.t('vendor.closed')}
        </div>
      )
    }

    let addProductText = (
      <span>
        <i className="fas fa-plus-square"></i> {i18n.t('vendor.add_product')}
      </span>
    )

    if(this.state.addingProduct){
      addProductText = (
        <span>
          <i className="fas fa-cog fa-spin"></i> {i18n.t('vendor.adding')}
        </span>
      )
    }


    return (
      <div className="main-card card w-100">
        <div className="content bridge row">
          <div className="col-8 p-1" style={{textAlign:'center'}}>
            <h2>{web3.utils.hexToUtf8(vendor.name)}</h2>
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
            this.setState({changingActive:true})
            let setActiveTo = !vendor.isActive
            tx(contracts[this.props.ERC20VENDOR].activateVendor(setActiveTo),120000,0,0,(result)=>{
              console.log("ACTIVE:",result)
              setTimeout(()=>{
                this.setState({changingActive:false})
              },1500)
            })
          }}>
            <Scaler config={{startZoomAt:500,origin:"40% 50%"}}>
              {venderButtonText}
            </Scaler>
          </button>
          </div>
        </div>
        {products}
        <div className="content bridge row">
          <div className="col-4 p-1">
            <input type="text" className="form-control" placeholder="Name..." value={this.state.newProductName}
                   onChange={event => this.setState({newProductName:event.target.value})} />
          </div>
          <div className="col-4 p-1">
          <div className="input-group">
            <div className="input-group-prepend">
              <div className="input-group-text">$</div>
            </div>
            <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.newProductAmount}
              onChange={event => this.setState({newProductAmount:event.target.value})} />
          </div>
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
            if(!this.state.newProductName || !this.state.newProductAmount){
              this.props.changeAlert({type: 'warning', message: 'Please enter a valid product and price.'})
            }else{
              //addProduct(uint256 id, bytes32 name, uint256 cost, bool isAvailable)
              let nextId = this.props.products.length
              this.setState({addingProduct:true})
              tx(contracts[this.props.ERC20VENDOR].addProduct(nextId,web3.utils.utf8ToHex(this.state.newProductName),web3.utils.toWei(""+this.state.newProductAmount, 'ether'),true),240000,0,0,(receipt)=>{
                console.log("PRODUCT ADDED",receipt)
                if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                  metaReceiptTracker[receipt.transactionHash] = true
                  this.setState({addingProduct:false,newProductAmount:"",newProductName:""})
                  setTimeout(this.poll.bind(this),100)
                }
              })
            }

          }}>
            <Scaler config={{startZoomAt:650,origin:"20% 50%"}}>
              {addProductText}
            </Scaler>
          </button>
          </div>
        </div>
      </div>
    )
  }
}
