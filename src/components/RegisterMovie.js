// @format
import React from 'react';
import i18n from '../i18n';
import ipfsClient from 'ipfs-http-client';
import {Buffer} from 'buffer';
import axios from 'axios';
import jsonp from 'jsonp';
import qs from 'qs';
import {Input, Button, OutlineButton} from 'rimble-ui';

import Uploader from './Uploader';

// Taken from Exchange.js
const GASBOOSTPRICE = 0.25;

const MAILCHIMP = {
  LIST: '94805126b3',
  REGION: 'us18',
  USER: '74327b20b5a290dfc1f6bf3f1',
};

export default class RegisterMovie extends React.Component {
  constructor(props) {
    super(props);
    this.ipfsEndpoint = 'ipfs.infura.io';
    this.ipfs = ipfsClient(this.ipfsEndpoint, '5001', {protocol: 'https'});
    this.submit = this.submit.bind(this);
    this.upload = this.upload.bind(this);

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
      uploader: {},
      canRegister: false,
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.props.scannerState !== newProps.scannerState) {
      this.setState({rightholderAddress: newProps.scannerState.toAddress});
    }
  }

  // NOTE: I had to do some horrible shit to make this work :(
  // Hidden inputs etc. :shrug:
  async registerEmail(email, address, rightholderName) {
    const params = qs.stringify({
      u: MAILCHIMP.USER,
      id: MAILCHIMP.LIST,
      EMAIL: email,
      // MERGE1 is first name on Mailchimp
      MERGE1: rightholderName,
      // MERGE2 is last name on Mailchimp. We cannot use MERGE3 as it doesn't
      // accept an ethereum address. Hence we use MERGE2
      MERGE2: address,
      b_123abc123abc123abc123abc123abc123abc: '',
      _: '1556635256096',
    });
    const url = `https://berlin.${
      MAILCHIMP.REGION
    }.list-manage.com/subscribe/post-json?${params}`;

    let data;
    try {
      // NOTE: Unfortunately, Mailchimp only allows the above URL to be queried
      // with jsonp. axios doesn't implement jsonp. Hence we're using this
      // separate library.
      data = await new Promise((resolve, reject) => {
        jsonp(url, {param: 'c'}, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    } catch (err) {
      // NOTE: We're not reporting this error back to the user, as we're not
      // deeming it important.
      console.log(err);
    }
    console.log(data);
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
    const {movieName, rightholderAddress, rightholderName, email} = this.refs;
    const {provider, meta, uploader} = this.state;

    changeView('loader');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);

    const token = {
      name: movieName.value,
      description: 'A movie registered by the Burner Wallet',
      image: uploader.posters,
      rightholder: {
        // NOTE: This is currently expressed through the ERC721 token holder
        //address: rightholderAddress.value,
        name: rightholderName.value,
      },
      movie: uploader.movies,
    };

    let tokenHash;
    try {
      tokenHash = await this.upload(Buffer(JSON.stringify(token)));
    } catch (err) {
      this.changeAlert({
        type: 'warning',
        message: "Couldn't upload token",
      });
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
        this.changeAlert({
          type: 'warning',
          message: "Couldn't send transaction",
        });
        console.log(err);
      }
      console.log('metareceipt', receipt);
      setReceipt({
        to: rightholderAddress.value,
        from: ERC721Full._address,
        badge: token,
        result: receipt,
      });
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
    }

    try {
      await this.registerEmail(
        email.value,
        rightholderAddress.value,
        rightholderName.value,
      );
    } catch (err) {
      // NOTE: We're not throwing an error to the UI here, as email registration
      // is not that important.
      console.log(err);
    }

    changeView('receipt');
  }

  async getGasAverage() {
    try {
      return (await axios.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
        {crossdomain: true},
      )).data.average;
    } catch (err) {
      console.log('Error getting gas price', err);
      return err;
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

  uploadStatus(uploaderId) {
    const {uploader} = this.state;
    return (err, urls) => {
      if (err) {
        this.changeAlert({
          type: 'warning',
          message: err.message,
        });
        console.log(err);
      }
      this.setState(
        Object.assign(uploader, {
          [uploaderId]: urls,
        }),
      );
      this.canRegister();
    };
  }

  canRegister() {
    const {uploader} = this.state;
    const {movieName, rightholderAddress, rightholderName, email} = this.refs;
    const canRegister = !(
      uploader &&
      uploader.posters &&
      uploader.movies &&
      movieName.value &&
      rightholderAddress.value &&
      rightholderName.value &&
      email.value
    );
    this.setState({
      canRegister,
    });
  }

  render() {
    const {rightholderAddress, uploader, canRegister} = this.state;

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie_title')}</label>
            <Uploader
              destinationBucket="cinemarket-videos"
              fileType="video"
              uploadStatus={this.uploadStatus('movies')}
            />
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.image_title')}</label>
            <Uploader
              fileType="image"
              uploadStatus={this.uploadStatus('posters')}
            />
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie.name')}</label>
            <div className="input-group">
              <Input
                width={1}
                type="text"
                placeholder="2001: A Space Odyssey..."
                ref="movieName"
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.rightholder.name')}</label>
            <div className="input-group">
              <Input
                width={1}
                type="text"
                placeholder="Stanley Kubrick..."
                ref="rightholderName"
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Email</label>
            <div className="input-group">
              <Input
                width={1}
                type="text"
                placeholder="Stanley@kubrick.com"
                ref="email"
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.rightholder.address')}</label>
            <div className="input-group">
              <Input
                width={1}
                type="text"
                placeholder="0x..."
                ref="rightholderAddress"
                defaultValue={rightholderAddress}
                onChange={this.canRegister.bind(this)}
              />
              <OutlineButton
                icon={'CenterFocusWeak'}
                mb={4}
                width={1}
                onClick={() => {
                  this.props.openScanner({view: 'mint', goBackView: 'mint'});
                }}>
                Scan QR Code
              </OutlineButton>
            </div>
          </div>
          <Button
            size={'large'}
            width={1}
            disabled={canRegister}
            onClick={this.submit}>
            Register
          </Button>
        </div>
      </div>
    );
  }
}
