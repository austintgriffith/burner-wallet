// @format
import React from 'react';
import i18n from '../i18n';
import ipfsClient from 'ipfs-http-client';
import {Buffer} from 'buffer';
import axios from 'axios';
import {Input, Button, OutlineButton} from 'rimble-ui';

import Uploader from './Uploader';

// Taken from Exchange.js
const GASBOOSTPRICE = 0.25;

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
    };
  }

  render() {
    const {rightholderAddress, uploader} = this.state;

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie.name')}</label>
            <div className="input-group">
              <Input
                width={1}
                type="text"
                placeholder="2001: A Space Odyssey..."
                ref="movieName"
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
          <div className="form-group w-100">
            <label>{i18n.t('mint.image_title')}</label>
            <Uploader
              fileType="image"
              uploadStatus={this.uploadStatus('posters')}
            />
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie_title')}</label>
            <Uploader
              destinationBucket="cinemarket-videos"
              fileType="video"
              uploadStatus={this.uploadStatus('movies')}
            />
          </div>
          <Button
            size={'large'}
            width={1}
            disabled={!(uploader && uploader.posters && uploader.movies)}
            name="theVeryBottom"
            onClick={this.submit}>
            Register
          </Button>
        </div>
      </div>
    );
  }
}
