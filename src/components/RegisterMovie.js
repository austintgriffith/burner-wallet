// @format
import React from 'react';
import i18n from '../i18n';
import ipfsClient from 'ipfs-http-client';
import {Buffer} from 'buffer';
import axios from 'axios';

// Taken from Exchange.js
const GASBOOSTPRICE = 0.25;

export default class RegisterMovie extends React.Component {
  constructor(props) {
    super(props);
    this.ipfsEndpoint = 'ipfs.infura.io';
    this.ipfs = ipfsClient(this.ipfsEndpoint, '5001', {protocol: 'https'});
    this.submit = this.submit.bind(this);
    this.upload = this.upload.bind(this);
    this.readFile = this.readFile.bind(this);

    const {mainnetweb3, address} = this.props;
    const pk = localStorage.getItem('metaPrivateKey');
    let mainnetMetaAccount = false;
    let mainnetMetaAddress = '';
    if (pk && pk != '0') {
      mainnetMetaAccount = mainnetweb3.eth.accounts.privateKeyToAccount(pk);
      mainnetMetaAddress = mainnetMetaAccount.address.toLowerCase();
    }

    this.state = {
      rightholderAddress: '',
      provider: {
        mainnet: {
          address,
        },
      },
      meta: {
        mainnet: {
          account: mainnetMetaAccount,
          address: mainnetMetaAddress,
        },
      },
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.props.scannerState !== newProps.scannerState) {
      this.setState({rightholderAddress: newProps.scannerState.toAddress});
    }
  }

  async submit() {
    const {
      mainnetweb3,
      ERC721Full,
      address,
      pTx,
      setReceipt,
      changeView,
    } = this.props;
    const {image, movieName, rightholderAddress, rightholderName} = this.refs;
    const {provider, meta} = this.state;

    let imageBuf;
    try {
      imageBuf = await this.readFile(image);
    } catch (err) {
      // TODO: Throw error to frontend
      console.log(err);
    }

    let imageHash;
    try {
      imageHash = await this.upload(imageBuf);
    } catch (err) {
      // TODO: Throw error to frontend
      console.log(err);
    }

    const token = {
      name: movieName.value,
      description: 'A movie registered by the Burner Wallet',
      image: `https://${this.ipfsEndpoint}/ipfs/${imageHash}`,
      rightholder: {
        // NOTE: This is currently expressed through the ERC721 token holder
        //address: rightholderAddress.value,
        name: rightholderName.value,
      },
    };

    let tokenHash;
    try {
      tokenHash = await this.upload(Buffer(JSON.stringify(token)));
    } catch (err) {
      // TODO: Throw error to frontend
      console.log(err);
    }

    if (meta.mainnet.account) {
      let receipt;
      try {
        receipt = await this.sendMetaTx(
          mainnetweb3,
          ERC721Full,
          'mint',
          [
            rightholderAddress.value,
            `https://${this.ipfsEndpoint}/ipfs/${tokenHash}`,
          ],
          meta.mainnet.address,
          ERC721Full._address,
          0,
          meta.mainnet.account.privateKey,
        );
      } catch (err) {
        // TODO: Throw error to frontend
        console.log(err);
      }
      console.log('metareceipt', receipt);
      setReceipt({
        to: rightholderAddress.value,
        from: ERC721Full._address,
        badge: token,
        result: receipt,
      });
      changeView('receipt');
    } else {
      const method = ERC721Full.mint(
        rightholderAddress.value,
        `https://${this.ipfsEndpoint}/ipfs/${tokenHash}`,
      );
      const gas = await method.estimateGas({from: provider.mainnet.address});
      const receipt = await pTx(method, gas, 0, 0);
      console.log('receipt', receipt);
      setReceipt({
        to: rightholderAddress.value,
        from: ERC721Full._address,
        badge: token,
        result: receipt,
      });
      changeView('receipt');
    }
  }

  async getGasAverage() {
    try {
      return (await axios.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
        {crossdomain: true},
      )).data.average;
    } catch (err) {
      return err;
      console.log('Error getting gas price', err);
    }
  }

  async sendMetaTx(
    web3,
    contract,
    methodName,
    params,
    from,
    to,
    value,
    privateKey,
  ) {
    let average;
    try {
      average = await this.getGasAverage();
    } catch (err) {
      return err;
    }

    if (average > 0 && average < 200) {
      // NOTE: We boost the gas price by 25%. Taken from other Burner Wallet
      // code
      average += average * GASBOOSTPRICE;
      const gwei = Math.round(average * 100) / 1000;

      const method = contract[methodName](...params);
      const data = method.encodeABI();
      const gas = await method.estimateGas({from});
      const tx = {
        from,
        data,
        to,
        value,
        gas,
        gasPrice: Math.round(gwei * 1000000000),
      };
      const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
      const raw = signed.rawTransaction;
      try {
        return await web3.eth.sendSignedTransaction(raw);
      } catch (err) {
        return err;
      }
    } else {
      return new Error('Error response from gassstation');
    }
  }

  async upload(buf) {
    try {
      return (await this.ipfs.add(buf, {
        pin: true,
      }))[0].hash;
    } catch (err) {
      return err;
    }
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      if (file.files.length) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(Buffer(reader.result));
        };
        reader.readAsArrayBuffer(file.files[0]);
      } else {
        reject(new Error('No file selected'));
      }
    });
  }

  render() {
    const {rightholderAddress} = this.state;

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie.name')}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="2001: A Space Odyssey..."
                ref="movieName"
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.rightholder.name')}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Stanley Kubrick..."
                ref="rightholderName"
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.rightholder.address')}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="0x..."
                ref="rightholderAddress"
                defaultValue={rightholderAddress}
              />
              <div
                className="input-group-append"
                onClick={() => {
                  this.props.openScanner({view: 'mint', goBackView: 'mint'});
                }}>
                <span
                  className="input-group-text"
                  id="basic-addon2"
                  style={this.props.buttonStyle.primary}>
                  <i style={{color: '#FFFFFF'}} className="fas fa-qrcode" />
                </span>
              </div>
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.image_title')}</label>
            <div className="input-group">
              <input ref="image" type="file" />
            </div>
          </div>
          <button
            name="theVeryBottom"
            className={`btn btn-lg w-100`}
            style={this.props.buttonStyle.primary}
            onClick={this.submit}>
            Register
          </button>
        </div>
      </div>
    );
  }
}
