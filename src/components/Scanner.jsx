import React from 'react';
import QRCodeScanner from "./QRCodeScanner.js"

export default class Scanner extends React.Component {
    constructor(props) {
      super(props);
    }

    onQRCodeValidate(location){
      console.log("Scanner: onQRCodeValidate",location)
      if(location.indexOf("http")>=0){
        //we are good this is already an http address
        window.location = location
      } else {
        //maybe they just scanned an address?
        window.location = "/"+location
      }
    }

    onQRCodeError(a,b){
      console.log("Scanner: onQRCodeError", a, b);
    }

    onQRCodeScan(location){
      //THIS DOESN:T SEEM TO EVER GET CALLED
      //BUT I HAVE IT HERE JUST IN CASE ? IDK
      console.log("Scanner: onQRCodeScan",location)
      if(location.indexOf("http")>=0){
        //we are good this is already an http address
        window.location = location
      } else {
        //maybe they just scanned an address?
        window.location = "/"+location.replace("Ethereum:","")
      }

    }

    toggleQRCodeScanner(){
      console.log("Scanner: toggleQRCodeScanner: " + this.props.scanning);
      this.props.setQrIsScanning(!this.props.scanning);
    }

    render() {

      let isScanning = this.props.scanning;
      let scanner = "";

      if(isScanning === true){
          scanner = <QRCodeScanner
            web3={this.props.web3}
            onValidate={this.onQRCodeValidate.bind(this)}
            onError={this.onQRCodeError.bind(this)}
            onScan={this.onQRCodeScan.bind(this)}
            onClose={this.toggleQRCodeScanner.bind(this)}
          />
      }else{
        scanner = <div></div>
      }

      return scanner;
    }
}
