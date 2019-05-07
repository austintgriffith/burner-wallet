// @format
import React from 'react';
import i18n from '../i18n';
import ipfsClient from 'ipfs-http-client';
import {Buffer} from 'buffer';
import axios from 'axios';
import jsonp from 'jsonp';
import qs from 'qs';
import {Input as RInput, Button, OutlineButton, Select, Field} from 'rimble-ui';
import Uploader from './Uploader';
import {Tx, Input, Output, Outpoint} from 'leap-core';
import bs58 from 'bs58';
import * as utils from 'ethereumjs-util';
import {BigInt, subtract} from 'jsbi-utils';

// Taken from Exchange.js
// TODO: Remove
const GASBOOSTPRICE = 0.25;

const NST_COLOR_BASE = 49153;
const BREED_COND =
  '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463451da9f981146030575b600080fd5b605f60048036036060811015604457600080fd5b50803590600160a060020a0360208201351690604001356061565b005b6040805160e060020a63451da9f902815260048101859052600160a060020a038416602482015260448101839052905173123333333333333333333333333333333333333391829163451da9f99160648082019260009290919082900301818387803b15801560cf57600080fd5b505af115801560e2573d6000803e3d6000fd5b505050505050505056fea165627a7a72305820a41e3a0e694cf54b47c2c04a682a2894cd1d00fc915a711bd650de34c3288e060029';
const TOKEN_TEMPLATE = '1233333333333333333333333333333333333333';
const BREED_GAS_COST = BigInt(12054948 + 2148176);

const MAILCHIMP = {
  LIST: '94805126b3',
  REGION: 'us18',
  USER: '74327b20b5a290dfc1f6bf3f1',
};

const uploadedMovies = [
  {
    name: 'Select pre-uploaded movie',
  },
  {
    name: 'Born to be Blue',
    hls:
      'https://s3.eu-central-1.amazonaws.com/cinemarket-videos/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue/Default/HLS/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue.m3u8',
    mp4:
      'https://s3.eu-central-1.amazonaws.com/cinemarket-videos/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue/Default/MP4/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue.mp4',
    image:
      'https://images-na.ssl-images-amazon.com/images/M/MV5BMjI3NTk0OTM5OF5BMl5BanBnXkFtZTgwOTMxMTE5NzE@._V1_SX300.jpg',
  },
  {
    name: 'WAR BOOK',
    hls:
      'https://s3.eu-central-1.amazonaws.com/cinemarket-videos/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK/Default/HLS/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK.m3u8',
    mp4:
      'https://s3.eu-central-1.amazonaws.com/cinemarket-videos/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK/Default/MP4/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK.mp4',
    image:
      'https://images-na.ssl-images-amazon.com/images/M/MV5BMjI2MDA2ODY1Ml5BMl5BanBnXkFtZTgwNDA0NzcyNDE@._V1_SX300.jpg',
  },
];

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace.replace('0x', ''));
}

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
      upload: true,
    };
  }

  componentWillReceiveProps(newProps) {
    const {rightholderAddress} = this.state;
    if (
      this.props.scannerState !== newProps.scannerState ||
      newProps.scannerState !== rightholderAddress
    ) {
      this.setState(
        {rightholderAddress: newProps.scannerState.toAddress},
        () => {
          this.canRegister();
        },
      );
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
      created: Math.floor(Date.now() / 1000),
    };

    let tokenHash;
    try {
      tokenHash = await this.upload(Buffer(JSON.stringify(token)));
    } catch (err) {
      this.props.changeAlert({
        type: 'warning',
        message: "Couldn't upload token",
      });
      console.log(err);
    }
    const rawHash = this.extractHash(tokenHash);
    let receipt;
    try {
      receipt = await this.mintPlasma(
        rightholderAddress.value,
        rawHash,
        meta.mainnet.account && meta.mainnet.account.privateKey,
      );
    } catch (err) {
      this.props.changeAlert({
        type: 'warning',
        message: "Transaction wasn't included in block",
      });
      console.log(err);
    }
    console.log('receipt', receipt);
    setReceipt({
      to: rightholderAddress.value,
      from: ERC721Full._address,
      badge: token,
      result: receipt,
    });

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

  async getUtxos(address, color) {
    const {xdaiweb3} = this.props;
    return (await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 42,
          method: 'plasma_unspent',
          params: [address],
        },
        (err, {result}) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        },
      );
    }))
      .filter(utxo => utxo.output.color === color)
      .map(utxo => {
        console.log('utxos', utxo);
        return {
          outpoint: Outpoint.fromRaw(utxo.outpoint),
          output: Output.fromJSON(utxo.output),
        };
      });
  }

  extractHash(hash) {
    const bytes = bs58.decode(hash).toString('hex');
    return '0x' + bytes.substring(4, bytes.length);
  }

  async mintPlasma(to, data, privateKey) {
    const {xdaiweb3, web3} = this.props;
    const color = 49154;
    const queenId =
      '0x000000000000000000000000000000000000000000000000000000000000053A';

    const colors = await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 42,
          method: 'plasma_getColors',
          params: [false, true],
        },
        (err, {result}) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        },
      );
    });
    const tokenAddr = colors[color - NST_COLOR_BASE]
      .replace('0x', '')
      .toLowerCase();
    const tmp = replaceAll(BREED_COND, TOKEN_TEMPLATE, tokenAddr);
    const script = Buffer.from(tmp, 'hex');
    const scriptHash = utils.ripemd160(script);
    const condAddr = `0x${scriptHash.toString('hex')}`;

    const queenUtxos = await this.getUtxos(condAddr, color);
    const queenUtxo = queenUtxos[0];

    const gasUtxos = await this.getUtxos(condAddr, 0);
    // todo: better selection
    // todo: check value > BREED_GAS_COST
    const gasUtxo = gasUtxos[0];

    const buffer = Buffer.alloc(64, 0);
    buffer.write(queenId.replace('0x', ''), 0, 'hex');
    buffer.write(queenUtxo.output.data.replace('0x', ''), 32, 'hex');
    const predictedId = utils.keccak256(buffer).toString('hex');
    const counter = Buffer.from(
      queenUtxo.output.data.replace('0x', ''),
      'hex',
    ).readUInt32BE(28);
    const buffer2 = Buffer.alloc(32, 0);
    buffer2.writeUInt32BE(counter + 1, 28);

    const condition = Tx.spendCond(
      [
        new Input({
          prevout: gasUtxo.outpoint,
          script,
        }),
        new Input({
          prevout: queenUtxo.outpoint,
        }),
      ],
      [
        new Output(queenId, condAddr, color, '0x' + buffer2.toString('hex')),
        new Output(`0x${predictedId}`, to, color, data),
        new Output(subtract(gasUtxo.output.value, BREED_GAS_COST), condAddr, 0),
      ],
    );

    const msgData = `0x451da9f9${queenId.replace(
      '0x',
      '',
    )}000000000000000000000000${to.replace('0x', '')}${data.replace('0x', '')}`;

    condition.inputs[0].setMsgData(msgData);

    if (privateKey) {
      condition.signAll(privateKey);
    } else {
      await condition.signWeb3(web3);
    }

    const {outputs} = await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 42,
          method: 'checkSpendingCondition',
          params: [condition.hex()],
        },
        (err, {result}) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        },
      );
    });
    // NOTE: We replace the gas output that we've created with the one that
    // the node returns to us.
    condition.outputs[2].value = outputs[2].value;

    await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 42,
          method: 'eth_sendRawTransaction',
          params: [condition.hex()],
        },
        (err, {result}) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        },
      );
    });
    let receipt;
    let rounds = 50;

    while (rounds--) {
      // redundancy rules ✊
      let res = await xdaiweb3.eth.getTransaction(condition.hash());

      if (res && res.blockHash) {
        receipt = res;
        break;
      }

      // wait ~100ms
      await new Promise(resolve => setTimeout(() => resolve(), 100));
    }

    if (receipt) {
      return receipt;
    }

    throw new Error("Transaction wasn't included into a block.");
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
        this.props.changeAlert({
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

  selectMovie(event) {
    if (event.target.value.indexOf('Select pre-uploaded movie') >= 0) {
      this.setState({
        uploader: {},
        upload: true,
        movieName: undefined,
      });
    } else {
      const movie = uploadedMovies.filter(
        ({name}) => event.target.value === name,
      )[0];
      this.uploadStatus('movies')(null, {mp4: movie.mp4, hls: movie.hls});
      this.uploadStatus('posters')(null, movie.image);
      this.setState({movieName: movie.name, upload: false});
    }
  }

  render() {
    const {
      rightholderAddress,
      uploader,
      canRegister,
      movieName,
      upload,
    } = this.state;

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <Field label="In case movie upload takes too long to upload">
              <Select
                items={uploadedMovies.map(movie => movie.name)}
                onChange={this.selectMovie.bind(this)}
                required={false}
              />
            </Field>
          </div>
          {upload
            ? [
                <div className="form-group w-100" key="movies">
                  <label>{i18n.t('mint.movie_title')}</label>
                  <Uploader
                    destinationBucket="cinemarket-videos"
                    fileType="video"
                    uploadStatus={this.uploadStatus('movies')}
                  />
                </div>,
                <div className="form-group w-100" key="posters">
                  <label>{i18n.t('mint.image_title')}</label>
                  <Uploader
                    fileType="image"
                    uploadStatus={this.uploadStatus('posters')}
                  />
                </div>,
              ]
            : null}
          <div className="form-group w-100">
            <label>{i18n.t('mint.movie.name')}</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="2001: A Space Odyssey..."
                ref="movieName"
                defaultValue={movieName}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t('mint.rightholder.name')}</label>
            <div className="input-group">
              <RInput
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
              <RInput
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
              <RInput
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
