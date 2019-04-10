// @format
import React from 'react';
import i18n from '../i18n';
import ipfsClient from 'ipfs-http-client';
import {Buffer} from 'buffer';

export default class RegisterMovie extends React.Component {
  constructor(props) {
    super(props);
    this.ipfsEndpoint = 'ipfs.infura.io';
    this.ipfs = ipfsClient(this.ipfsEndpoint, '5001', {protocol: 'https'});
    this.submit = this.submit.bind(this);
    this.upload = this.upload.bind(this);
    this.readFile = this.readFile.bind(this);

    const {scannerState} = this.props;
    this.state = {
      rightholderAddress: scannerState.toAddress || '',
    };
  }

  async submit() {
    const {web3, ERC721Full, address} = this.props;
    const {image, movieName, rightholderAddress, rightholderName} = this.refs;

    let imageBuf;
    try {
      imageBuf = await this.readFile(image);
    } catch (err) {
      // TODO: Handle this error in the frontend
    }
    // TODO: Check which errors to catch and throw them to the frontend
    const imageHash = await this.upload(imageBuf);

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

    // TODO: Check which errors to catch and throw them to the frontend
    const tokenHash = await this.upload(Buffer(JSON.stringify(token)));
    try {
      await ERC721Full.mint(rightholderAddress.value, tokenHash).send({
        from: address,
      });
    } catch (err) {
      // TODO: bubble this error to the frontend
      console.log(err);
    }
  }

  async upload(buf) {
    const res = await this.ipfs.add(buf, {
      pin: true,
    });

    return res[0].hash;
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
                  this.props.openScanner({view: 'mint'});
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
