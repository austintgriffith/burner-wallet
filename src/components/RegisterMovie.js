// @format
import React from "react";
import i18n from "../i18n";
import ipfsClient from "ipfs-http-client";
import { Buffer } from "buffer";
import axios from "axios";
import jsonp from "jsonp";
import qs from "qs";
import {
  Input as RInput,
  Button,
  OutlineButton,
  Select,
  Field
} from "rimble-ui";
import Uploader from "./Uploader";
import { Tx, Input, Output, Outpoint } from "leap-core";
import bs58 from "bs58";
import * as utils from "ethereumjs-util";
import { BigInt, subtract } from "jsbi-utils";

// Taken from Exchange.js
// TODO: Remove
const GASBOOSTPRICE = 0.25;

const NST_COLOR_BASE = 49153;
const BREED_COND =
  "6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463451da9f981146030575b600080fd5b605f60048036036060811015604457600080fd5b50803590600160a060020a0360208201351690604001356061565b005b6040805160e060020a63451da9f902815260048101859052600160a060020a038416602482015260448101839052905173123333333333333333333333333333333333333391829163451da9f99160648082019260009290919082900301818387803b15801560cf57600080fd5b505af115801560e2573d6000803e3d6000fd5b505050505050505056fea165627a7a72305820a41e3a0e694cf54b47c2c04a682a2894cd1d00fc915a711bd650de34c3288e060029";
const TOKEN_TEMPLATE = "1233333333333333333333333333333333333333";
const BREED_GAS_COST = BigInt(12054948 + 2148176);

const MAILCHIMP = {
  LIST: "94805126b3",
  REGION: "us18",
  USER: "74327b20b5a290dfc1f6bf3f1"
};

const uploadedMovies = [
  {
    name: "Select pre-uploaded movie"
  },
  {
    name: "Born to be Blue",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue/Default/HLS/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue/Default/MP4/0af7e111-5314-4efc-9fb7-6968abed4e45-BorntobeBlue.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMjI3NTk0OTM5OF5BMl5BanBnXkFtZTgwOTMxMTE5NzE@._V1_SX300.jpg",
    year: "2015",
    cast: "Ethan Hawke",
    cast2: "Carmen Ejogo",
    director: "Robert Budreau",
    producer: "Jennifer Jones",
    rightholderName: "Kino Vista"
  },
  {
    name: "WAR BOOK",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK/Default/HLS/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK/Default/MP4/bb4cd27e-562c-4218-b197-1916f95c98b9-WARBOOK.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMjI2MDA2ODY1Ml5BMl5BanBnXkFtZTgwNDA0NzcyNDE@._V1_SX300.jpg",
    year: "2014",
    cast: "Sophie Okonedo",
    cast2: "Ben Chaplin",
    director: "Tom Harper",
    producer: "Laurne Dark",
    rightholderName: "K5"
  },
  {
    name: "Cutie and the Boxer",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/3215882d-28c6-4a80-9a59-e2c2652d4778-CutieAndTheBoxer/Default/HLS/3215882d-28c6-4a80-9a59-e2c2652d4778-CutieAndTheBoxer.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/3215882d-28c6-4a80-9a59-e2c2652d4778-CutieAndTheBoxer/Default/MP4/3215882d-28c6-4a80-9a59-e2c2652d4778-CutieAndTheBoxer.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMjEyNzgyMjUzNl5BMl5BanBnXkFtZTcwODk3NjQyOQ@@._V1_SX300.jpg",
    year: "2013",
    cast: "Alex Shinohara",
    cast2: "Ushio Shinohara",
    director: "Zachary Heinzerling",
    producer: "Patrick Burns",
    rightholderName: "K5"
  },
  {
    name: "Dancing in Jaffa",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/2c66fea2-27a3-493f-a8e4-b9f0d91d8008-Dancing_In_Jaffa_Trailer/Default/HLS/2c66fea2-27a3-493f-a8e4-b9f0d91d8008-Dancing_In_Jaffa_Trailer.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/2c66fea2-27a3-493f-a8e4-b9f0d91d8008-Dancing_In_Jaffa_Trailer/Default/MP4/2c66fea2-27a3-493f-a8e4-b9f0d91d8008-Dancing_In_Jaffa_Trailer.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMTgzMzU0MDQ5Nl5BMl5BanBnXkFtZTgwMzUyNDQ0MTE@._V1_SX300.jpg",
    year: "2013",
    cast: "Pierre Dulaine",
    cast2: "Yvonne Marceau",
    director: "Hilla Madeila",
    producer: "Diana Nabatoff",
    rightholderName: "M6 Video"
  },
  {
    name: "Superfast",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/814e8646-195a-4e71-bee2-294ba2fab4c1-Superfast/Default/HLS/814e8646-195a-4e71-bee2-294ba2fab4c1-Superfast.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/814e8646-195a-4e71-bee2-294ba2fab4c1-Superfast/Default/MP4/814e8646-195a-4e71-bee2-294ba2fab4c1-Superfast.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BNjM3MjQxNjkxM15BMl5BanBnXkFtZTgwMDIyMTA0NDE@._V1_SX300.jpg",
    year: "2015",
    cast: "Alex Ashbaug",
    cast2: "Dale Pavinski",
    director: "Jason Friedberg",
    producer: "Aaron Seltzer",
    rightholderName: "K5"
  },
  {
    name: "Paterson",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/cce890dd-7dbf-48a1-b7f5-055cf6b531f2-Paterson/Default/HLS/cce890dd-7dbf-48a1-b7f5-055cf6b531f2-Paterson.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/cce890dd-7dbf-48a1-b7f5-055cf6b531f2-Paterson/Default/MP4/cce890dd-7dbf-48a1-b7f5-055cf6b531f2-Paterson.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMTUzODA4Nzk0OF5BMl5BanBnXkFtZTgwNzE1MDIwMDI@._V1_SX300.jpg",
    year: "2016",
    cast: "Adam Driver",
    cast2: "Golshifteh Farahani",
    director: "Jim Jarmusch",
    producer: "Joshua Astrachan",
    rightholderName: "Le Pacte"
  },
  {
    name: "The Reluctant Fundamentalist",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/87195369-2ec4-471a-986f-93f89461b9b1-TheReluctantFundamentalist/Default/HLS/87195369-2ec4-471a-986f-93f89461b9b1-TheReluctantFundamentalist.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/87195369-2ec4-471a-986f-93f89461b9b1-TheReluctantFundamentalist/Default/MP4/87195369-2ec4-471a-986f-93f89461b9b1-TheReluctantFundamentalist.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BNzAzNjg3Mzg1Nl5BMl5BanBnXkFtZTcwOTUzNzExOQ@@._V1._CR25,27.166671752929688,1347,1995.9999542236328_SY132_CR0,0,89,132_AL_.jpg_V1_SX300.jpg",
    year: "2012",
    cast: "Riz Ahmed",
    cast2: "Liev Schrieber",
    director: "Mira Nair",
    producer: "Lydia Dean Pilcher",
    rightholderName: "K5"
  },
  {
    name: "Next Goal Wins",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/9f88e165-86eb-4449-b9b5-8f9c4080b898-NextGoalWins/Default/HLS/9f88e165-86eb-4449-b9b5-8f9c4080b898-NextGoalWins.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/9f88e165-86eb-4449-b9b5-8f9c4080b898-NextGoalWins/Default/MP4/9f88e165-86eb-4449-b9b5-8f9c4080b898-NextGoalWins.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMjI3ODcxOTExNl5BMl5BanBnXkFtZTgwOTU0NTg1MTE@._V1_SX300.jpg",
    year: "2014",
    cast: "Thomas Rongen",
    cast2: "Jaiyah Saelua",
    director: "Mike Brett",
    producer: "Steve Jamison",
    rightholderName: "K5"
  },
  {
    name: "Night Train to Lisbon",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/16257e04-7899-4271-9829-07b529b67048-NightTrainToLisbon/Default/HLS/16257e04-7899-4271-9829-07b529b67048-NightTrainToLisbon.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/16257e04-7899-4271-9829-07b529b67048-NightTrainToLisbon/Default/MP4/16257e04-7899-4271-9829-07b529b67048-NightTrainToLisbon.mp4",
    image:
      "https://ia.media-imdb.com/images/M/MV5BNDE5OTkxNzMxNl5BMl5BanBnXkFtZTgwMjQ4NjY3MDE@._V1_SX300.jpg",
    year: "2013",
    cast: "Jeremy Irons",
    cast2: "Melanie Laurent",
    director: "Billie August",
    producer: "Kerstin Ramcke",
    rightholderName: "K5"
  },
  {
    name: "One More Time",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/131ed43f-04e2-4fb6-90a1-e2c1e416094b-OneMoreTime/Default/HLS/131ed43f-04e2-4fb6-90a1-e2c1e416094b-OneMoreTime.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/131ed43f-04e2-4fb6-90a1-e2c1e416094b-OneMoreTime/Default/MP4/131ed43f-04e2-4fb6-90a1-e2c1e416094b-OneMoreTime.mp4",
    image:
      "https://images-na.ssl-images-amazon.com/images/M/MV5BMjAxMTk0MTUxNV5BMl5BanBnXkFtZTgwNTY0MjAzODE@._V1_SX300.jpg",
    year: "2015",
    cast: "Christopher Walken",
    cast2: "Amber Heard",
    director: "Robert Edwards",
    producer: "Jay van Hoy",
    rightholderName: "K5"
  },
  {
    name: "The Diary of a Teenage Girl",
    year: "2015",
    cast: "Bel Powley",
    cast2: "Kristen Wiig",
    director: "Marielle Heller",
    producer: "Anne Carey",
    rightholderName: "K5",
    image:
      "https://ia.media-imdb.com/images/M/MV5BMjE4MTQ3NTgwOF5BMl5BanBnXkFtZTgwMDQ3NTc5NTE@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/cb2206d6-dd4a-4600-9b41-37553a3c6bf3-DiaryOfATeenageGirl/Default/HLS/cb2206d6-dd4a-4600-9b41-37553a3c6bf3-DiaryOfATeenageGirl.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/cb2206d6-dd4a-4600-9b41-37553a3c6bf3-DiaryOfATeenageGirl/Default/MP4/cb2206d6-dd4a-4600-9b41-37553a3c6bf3-DiaryOfATeenageGirl.mp4"
  },
  {
    name: "The Survivalist",
    year: "2015",
    cast: "Mia Goth",
    cast2: "Martin McCann",
    director: "Stephen Fingelton",
    producer: "Wayne Marc Godfrey",
    rightholderName: "K5",
    image:
      "https://ia.media-imdb.com/images/M/MV5BNjA0YTRiMDMtYTdjMi00YjgyLTkwMTQtMWVjOTMyYTE5YWQ3XkEyXkFqcGdeQXVyMjMxNTAxNDk@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/1206b83a-1fed-47c0-b6b3-ed52c593e955-TheSURVIVALIST/Default/HLS/1206b83a-1fed-47c0-b6b3-ed52c593e955-TheSURVIVALIST.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/1206b83a-1fed-47c0-b6b3-ed52c593e955-TheSURVIVALIST/Default/MP4/1206b83a-1fed-47c0-b6b3-ed52c593e955-TheSURVIVALIST.mp4"
  },
  {
    name: "Toast",
    year: "2010",
    cast: "Oscar Kennedy",
    director: "S.J Clarkson",
    producer: "Faye Ward",
    rightholderName: "UGC PH",
    image:
      "https://ia.media-imdb.com/images/M/MV5BMjAxNTIzMjA2NF5BMl5BanBnXkFtZTcwNDQ5ODIxNw@@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/569ac4fc-9d95-4291-b4ac-40da06c61812-TOAST/Default/HLS/569ac4fc-9d95-4291-b4ac-40da06c61812-TOAST.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/569ac4fc-9d95-4291-b4ac-40da06c61812-TOAST/Default/MP4/569ac4fc-9d95-4291-b4ac-40da06c61812-TOAST.mp4"
  },
  {
    name: "Vehicle 19",
    year: "2013",
    cast: "Paul Walker",
    director: "Mukunda Michael Dewil",
    producer: "Peter Safran",
    rightholderName: "Canal+",
    image:
      "https://ia.media-imdb.com/images/M/MV5BMTk0NDU4ODc4OF5BMl5BanBnXkFtZTcwMjIwMTU1OQ@@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/85444ba3-a79f-41f7-b210-31268c9304f8-Vehicle19/Default/HLS/85444ba3-a79f-41f7-b210-31268c9304f8-Vehicle19.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/85444ba3-a79f-41f7-b210-31268c9304f8-Vehicle19/Default/MP4/85444ba3-a79f-41f7-b210-31268c9304f8-Vehicle19.mp4"
  },
  {
    name: "Vice",
    year: "2018",
    cast: "Christian Bale",
    cast2: "Amy Adams",
    director: "Adam McKay",
    image:
      "https://ia.media-imdb.com/images/M/MV5BMjE4OTg3Mjg5OV5BMl5BanBnXkFtZTgwMzYxMTg0MzE@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/5e53069d-12fe-46d4-b4f1-ce227006079f-Vice/Default/HLS/5e53069d-12fe-46d4-b4f1-ce227006079f-Vice.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/5e53069d-12fe-46d4-b4f1-ce227006079f-Vice/Default/MP4/5e53069d-12fe-46d4-b4f1-ce227006079f-Vice.mp4"
  },
  {
    name: "Anon",
    year: "2018",
    cast: "Clive Owen",
    cast2: "Afiya Bennett",
    director: "Andrew Niccol",
    producer: "Daniel Baur",
    rightholderName: "Netflix",
    image:
      "https://ia.media-imdb.com/images/M/MV5BMjE0MjIwMDE2MV5BMl5BanBnXkFtZTgwMzM5MDQzNTM@._V1_SX300.jpg",
    hls:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/9a781678-1637-4871-abc1-45df47757508-ANON_TSR_REV_VERS_BROADCAST_PRORESHQ/Default/HLS/9a781678-1637-4871-abc1-45df47757508-ANON_TSR_REV_VERS_BROADCAST_PRORESHQ.m3u8",
    mp4:
      "https://s3.eu-central-1.amazonaws.com/cinemarket-videos/9a781678-1637-4871-abc1-45df47757508-ANON_TSR_REV_VERS_BROADCAST_PRORESHQ/Default/MP4/9a781678-1637-4871-abc1-45df47757508-ANON_TSR_REV_VERS_BROADCAST_PRORESHQ.mp4"
  }
];

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, "g"), replace.replace("0x", ""));
}

export default class RegisterMovie extends React.Component {
  constructor(props) {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);
    super(props);
    this.ipfsEndpoint = "ipfs.infura.io";
    this.ipfs = ipfsClient(this.ipfsEndpoint, "5001", { protocol: "https" });
    this.submit = this.submit.bind(this);
    this.upload = this.upload.bind(this);

    const { mainnetweb3, address } = this.props;
    const pk = localStorage.getItem("metaPrivateKey");
    let mainnetMetaAccount = false;
    let mainnetMetaAddress = "";
    if (pk && pk != "0") {
      mainnetMetaAccount = mainnetweb3.eth.accounts.privateKeyToAccount(pk);
      mainnetMetaAddress = mainnetMetaAccount.address.toLowerCase();
    }

    this.state = {
      rightholderAddress: "",
      provider: {
        mainnet: {
          address
        }
      },
      meta: {
        mainnet: {
          account: mainnetMetaAccount,
          address: mainnetMetaAddress
        }
      },
      uploader: {},
      canRegister: false,
      upload: true,
      movie: {}
    };
  }

  componentWillReceiveProps(newProps) {
    const { rightholderAddress } = this.state;
    if (this.props.scannerState !== newProps.scannerState) {
      this.handleAddress({
        target: {
          value: newProps.scannerState.toAddress
        }
      });
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
      b_123abc123abc123abc123abc123abc123abc: "",
      _: "1556635256096"
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
        jsonp(url, { param: "c" }, (err, data) => {
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
      changeView
    } = this.props;
    const {
      movieName,
      movieYear,
      movieCast,
      movieCast2,
      movieDirector,
      movieProducer,
      rightholderName,
      email
    } = this.refs;
    const { provider, meta, uploader, rightholderAddress } = this.state;

    changeView("loader");
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);

    const token = {
      name: movieName.value,
      description: "A movie registered by the Motion Wallet",
      image: uploader.posters,
      rightholder: {
        // NOTE: This is currently expressed through the ERC721 token holder
        //address: rightholderAddress.value,
        name: rightholderName.value
      },
      movie: uploader.movies,
      created: Math.floor(Date.now() / 1000),
      year: parseInt(movieYear.value, 10),
      cast: movieCast2.value
        ? [movieCast.value, movieCast2.value]
        : [movieCast.value],
      director: movieDirector.value,
      producer: movieProducer.value
    };

    let tokenHash;
    try {
      tokenHash = await this.upload(Buffer(JSON.stringify(token)));
    } catch (err) {
      this.props.changeAlert({
        type: "warning",
        message: "Couldn't upload token"
      });
      console.log(err);
    }
    const rawHash = this.extractHash(tokenHash);
    let receipt;
    try {
      receipt = await this.mintPlasma(
        rightholderAddress,
        rawHash,
        meta.mainnet.account && meta.mainnet.account.privateKey
      );
    } catch (err) {
      this.props.changeAlert({
        type: "warning",
        message: "Transaction wasn't included in block"
      });
      console.log(err);
    }
    console.log("receipt", receipt);
    setReceipt({
      to: rightholderAddress,
      from: ERC721Full._address,
      badge: token,
      result: receipt
    });

    try {
      await this.registerEmail(
        email.value,
        rightholderAddress,
        rightholderName.value
      );
    } catch (err) {
      // NOTE: We're not throwing an error to the UI here, as email registration
      // is not that important.
      console.log(err);
    }

    changeView("receipt");
  }

  async getUtxos(address, color) {
    const { xdaiweb3 } = this.props;
    return (await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: "2.0",
          id: 42,
          method: "plasma_unspent",
          params: [address]
        },
        (err, { result }) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    }))
      .filter(utxo => utxo.output.color === color)
      .map(utxo => {
        console.log("utxos", utxo);
        return {
          outpoint: Outpoint.fromRaw(utxo.outpoint),
          output: Output.fromJSON(utxo.output)
        };
      });
  }

  extractHash(hash) {
    const bytes = bs58.decode(hash).toString("hex");
    return "0x" + bytes.substring(4, bytes.length);
  }

  async mintPlasma(to, data, privateKey) {
    const { xdaiweb3, web3 } = this.props;
    const color = 49154;
    const queenId =
      "0x000000000000000000000000000000000000000000000000000000000000053A";

    const colors = await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: "2.0",
          id: 42,
          method: "plasma_getColors",
          params: [false, true]
        },
        (err, { result }) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });
    const tokenAddr = colors[color - NST_COLOR_BASE]
      .replace("0x", "")
      .toLowerCase();
    const tmp = replaceAll(BREED_COND, TOKEN_TEMPLATE, tokenAddr);
    const script = Buffer.from(tmp, "hex");
    const scriptHash = utils.ripemd160(script);
    const condAddr = `0x${scriptHash.toString("hex")}`;

    const queenUtxos = await this.getUtxos(condAddr, color);
    const queenUtxo = queenUtxos[0];

    const gasUtxos = await this.getUtxos(condAddr, 0);
    // todo: better selection
    // todo: check value > BREED_GAS_COST
    const gasUtxo = gasUtxos[0];

    const buffer = Buffer.alloc(64, 0);
    buffer.write(queenId.replace("0x", ""), 0, "hex");
    buffer.write(queenUtxo.output.data.replace("0x", ""), 32, "hex");
    const predictedId = utils.keccak256(buffer).toString("hex");
    const counter = Buffer.from(
      queenUtxo.output.data.replace("0x", ""),
      "hex"
    ).readUInt32BE(28);
    const buffer2 = Buffer.alloc(32, 0);
    buffer2.writeUInt32BE(counter + 1, 28);

    const condition = Tx.spendCond(
      [
        new Input({
          prevout: gasUtxo.outpoint,
          script
        }),
        new Input({
          prevout: queenUtxo.outpoint
        })
      ],
      [
        new Output(queenId, condAddr, color, "0x" + buffer2.toString("hex")),
        new Output(`0x${predictedId}`, to, color, data),
        new Output(subtract(gasUtxo.output.value, BREED_GAS_COST), condAddr, 0)
      ]
    );

    const msgData = `0x451da9f9${queenId.replace(
      "0x",
      ""
    )}000000000000000000000000${to.replace("0x", "")}${data.replace("0x", "")}`;

    condition.inputs[0].setMsgData(msgData);

    if (privateKey) {
      condition.signAll(privateKey);
    } else {
      await condition.signWeb3(web3);
    }

    const { outputs } = await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: "2.0",
          id: 42,
          method: "checkSpendingCondition",
          params: [condition.hex()]
        },
        (err, { result }) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });
    // NOTE: We replace the gas output that we've created with the one that
    // the node returns to us.
    condition.outputs[2].value = outputs[2].value;

    await new Promise((resolve, reject) => {
      xdaiweb3.currentProvider.send(
        {
          jsonrpc: "2.0",
          id: 42,
          method: "eth_sendRawTransaction",
          params: [condition.hex()]
        },
        (err, { result }) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
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
        pin: true
      }))[0].hash;
    } catch (err) {
      return err;
    }
  }

  uploadStatus(uploaderId) {
    const { uploader } = this.state;
    return (err, urls) => {
      if (err) {
        this.props.changeAlert({
          type: "warning",
          message: err.message
        });
        console.log(err);
      }
      this.setState(
        Object.assign(uploader, {
          [uploaderId]: urls
        })
      );
      this.canRegister();
    };
  }

  canRegister() {
    const { uploader } = this.state;
    let { rightholderAddress } = this.state;
    const { xdaiweb3 } = this.props;
    const {
      movieName,
      movieYear,
      movieCast,
      movieCast2,
      movieDirector,
      movieProducer,
      rightholderName,
      email
    } = this.refs;
    // NOTE: We first check if rightholderAddress can be converted to a checksum
    // address before we continue evaluating. If it errors, we can safely set
    // canRegister to false as the form shouldn't be submitted without a valid
    // address.
    try {
      rightholderAddress = xdaiweb3.utils.toChecksumAddress(rightholderAddress);
    } catch (err) {
      this.setState({ canRegister: false });
      return;
    }

    const canRegister =
      uploader &&
      uploader.posters &&
      uploader.movies &&
      movieName.value &&
      movieYear.value &&
      movieCast.value &&
      // NOTE movieCast2 is not required
      movieDirector.value &&
      movieProducer.value &&
      xdaiweb3.utils.isAddress(rightholderAddress) &&
      rightholderName.value &&
      email.value;
    this.setState({
      canRegister
    });
  }

  selectMovie(event) {
    if (event.target.value.indexOf("Select pre-uploaded movie") >= 0) {
      this.setState({
        uploader: {},
        upload: true,
        movie: {}
      });
    } else {
      const movie = uploadedMovies.filter(
        ({ name }) => event.target.value === name
      )[0];
      this.uploadStatus("movies")(null, { mp4: movie.mp4, hls: movie.hls });
      this.uploadStatus("posters")(null, movie.image);
      this.setState({
        movie: {
          name: movie.name,
          year: movie.year,
          cast: movie.cast,
          cast2: movie.cast2,
          director: movie.director,
          producer: movie.producer,
          rightholderName: movie.rightholderName
        },
        upload: false
      });
    }
  }

  handleAddress(event) {
    const { xdaiweb3 } = this.props;
    this.setState({ rightholderAddress: event.target.value }, () => {
      this.canRegister();
    });
  }

  render() {
    const {
      rightholderAddress,
      uploader,
      canRegister,
      movie,
      upload
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
                  <label>{i18n.t("mint.movie_title")}</label>
                  <Uploader
                    destinationBucket="cinemarket-videos"
                    fileType="video"
                    uploadStatus={this.uploadStatus("movies")}
                  />
                </div>,
                <div className="form-group w-100" key="posters">
                  <label>{i18n.t("mint.image_title")}</label>
                  <Uploader
                    fileType="image"
                    uploadStatus={this.uploadStatus("posters")}
                  />
                </div>
              ]
            : null}
          <div className="form-group w-100">
            <label>{i18n.t("mint.movie.name")}</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="2001: A Space Odyssey"
                ref="movieName"
                defaultValue={movie.name}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Year</label>
            <div className="input-group">
              <RInput
                width={1}
                type="number"
                placeholder="1968"
                ref="movieYear"
                defaultValue={movie.year}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Cast</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="Keir Dullea"
                ref="movieCast"
                defaultValue={movie.cast}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Cast (more)</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="Gary Lockwood"
                ref="movieCast2"
                defaultValue={movie.cast2}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Director</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="Stanley Kubrick"
                ref="movieDirector"
                defaultValue={movie.director}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>Producer</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="Stanley Kubrick"
                ref="movieProducer"
                defaultValue={movie.producer}
                onChange={this.canRegister.bind(this)}
              />
            </div>
          </div>
          <div className="form-group w-100">
            <label>{i18n.t("mint.rightholder.name")}</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="Warner Bros. Entertainment Inc."
                ref="rightholderName"
                defaultValue={movie.rightholderName}
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
            <label>{i18n.t("mint.rightholder.address")}</label>
            <div className="input-group">
              <RInput
                width={1}
                type="text"
                placeholder="0x..."
                value={rightholderAddress}
                onChange={this.handleAddress.bind(this)}
              />
              <OutlineButton
                icon={"CenterFocusWeak"}
                mb={4}
                width={1}
                onClick={() => {
                  this.props.openScanner({ view: "mint", goBackView: "mint" });
                }}
              >
                Scan QR Code
              </OutlineButton>
            </div>
          </div>
          <Button
            size={"large"}
            width={1}
            disabled={!canRegister}
            onClick={this.submit}
          >
            Register
          </Button>
        </div>
      </div>
    );
  }
}
