import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Share from './Share'
import i18n from '../i18n';
import cookie from 'react-cookies'
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"
const QRCode = require('qrcode.react');

export default class ScavengerHunt extends React.Component {

  constructor(props) {
    super(props);

    let ownerSalt = cookie.load('ownerSalt')
    if (!ownerSalt) {
      // Generate salt for owner 
      ownerSalt = props.web3.utils.sha3(""+Math.random())
      cookie.save('ownerSalt', ownerSalt, { path: '/'})
      console.log('Genrate ownerSalt: ', ownerSalt)
    } 

    let playerSalt = cookie.load('playerSalt')
    if (!playerSalt) {
      // Generate salt for player
      playerSalt = props.web3.utils.sha3(""+Math.random())
      cookie.save('playerSalt', playerSalt, { path: '/'})
      console.log('Genrate playerSalt: ', playerSalt)
    }

    let playerAnswers = cookie.load('playerAnswers')
    if (!playerAnswers) {
      playerAnswers = new Array(20);
      playerAnswers.fill("")
    }

    let ownerAnswers = cookie.load('ownerAnswers')
    if (!ownerAnswers) ownerAnswers = [""];

    var urlParams = new URLSearchParams(window.location.search);
    var questionIndex = urlParams.get("q")      // question index
    var qrAnswer = urlParams.get("a")           // answer to question index

    this.state = {
      gameEndTime: 0,
      revealEndTime: 0,
      status: props.web3.utils.utf8ToHex('Pending'),
      winner: 0x0,
      view: "playerView",
      isOwner: false,
      numQuestions: 0,
      numPlayers: 0,
      numScavengerAnswers: ownerAnswers.length,    // Owner Number of questions to create for scavenger hunt
      revealedAnswers: [],
      playerAnswers,
      ownerAnswers,
      ownerSalt,
      playerSalt,
      playerData: [0, 0],
      YourContract: false,
      yourContractBalance: 0,
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
      questionIndex,
      qrAnswer,
      revealed: false,
      timeRemaining:{
        'total': 0,
        'days': 0,
        'hours': 0,
        'minutes': 0,
        'seconds': 0
      },
      playerList: []
    }
  }

  componentDidMount(){
    console.log("YOUR MODULE MOUNTED, PROPS:",this.props)
    /*
        -- LOAD YOUR CONTRACT --
        Contract files loaded from:
        src/contracts/YourContract.abi
        src/contracts/YourContract.address
        src/contracts/YourContract.blocknumber.js // the block number it was deployed at (for efficient event loading)
        src/contracts/YourContrct.bytecode.js // if you want to deploy the contract from the module (see deployYourContract())
    */

    var urlParams = new URLSearchParams(window.location.search);
    var contractAddress = urlParams.get("game")

    if (!contractAddress) {
      this.setState({
      YourContract: this.props.contractLoader("ScavengerHunt")
      },()=>{
      console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
      })
    } else{
      this.setState({
        YourContract: this.props.contractLoader("ScavengerHunt", contractAddress)
      },()=>{
        console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
      }) 
    }

    setInterval(this.pollInterval.bind(this),2500)
    setTimeout(this.pollInterval.bind(this),30)
  }

  getTimeRemaining(endtime){
    var t = endtime * 1000 - Date.parse(new Date());
    var seconds = Math.floor( (t/1000) % 60 );
    var minutes = Math.floor( (t/1000/60) % 60 );
    var hours = Math.floor( (t/(1000*60*60)) % 24 );
    var days = Math.floor( t/(1000*60*60*24) );
    if (t < 0) {
      seconds = 0
      minutes = 0
      hours = 0
      days = 0
    }
    return {
      'total': t,
      'days': ('0' + days).slice(-2),
      'hours': ('0' + hours).slice(-2),
      'minutes': ('0' + minutes).slice(-2),
      'seconds': ('0' + seconds).slice(-2) 
    };
  }

  async pollInterval(){
    console.log("POLL")
    if(this.state && this.state.YourContract){
      let owner = await this.state.YourContract.owner().call();
      let isOwner = (owner == this.props.address);
      let status = await this.state.YourContract.status().call();
      let gameEndTime = await this.state.YourContract.gameEndTime().call();
      let revealEndTime = await this.state.YourContract.revealEndTime().call();
      let numQuestions = parseInt(await this.state.YourContract.getNumQuestions().call());
      let numPlayers = parseInt(await this.state.YourContract.getNumPlayers().call());
      let winner = await this.state.YourContract.winner().call();
      let yourContractBalance = await this.props.web3.eth.getBalance(this.state.YourContract._address)
      //let ensName = await this.props.ensLookup("austingriffith.eth")
      let mainnetBlockNumber = await this.props.mainnetweb3.eth.getBlockNumber()
      let xdaiBlockNumber = await this.props.xdaiweb3.eth.getBlockNumber()
      yourContractBalance = this.props.web3.utils.fromWei(yourContractBalance,'ether')
      let playerData = await this.state.YourContract.getPlayerData(this.props.address).call()
      let playerAnswers = this.state.playerAnswers
      let revealed = this.state.revealed
      let revealedAnswers = this.state.revealedAnswers
      let toAddress = this.state.toAddress

      let playerList = new Array(numPlayers)
      playerList.fill({})

      let time = 0
      if (this.props.web3.utils.hexToString(this.state.status) === "Start") {
        time = gameEndTime
      } else {
        time = revealEndTime
      }

      if (this.props.web3.utils.hexToString(this.state.status) === "Reveal" && !revealed) {
        revealedAnswers = new Array(numQuestions);
        for (const i of playerAnswers.keys()) {
          revealedAnswers[i] = await this.state.YourContract.revealedAnswers(i).call()
        }
        revealed = true
      }

      let timeRemaining = this.getTimeRemaining(time);

      if (this.state.playerAnswers.length != numQuestions) {
        playerAnswers = new Array(numQuestions);
        playerAnswers.fill("")
      }

      if (this.state.questionIndex && this.state.qrAnswer) {
        playerAnswers[this.state.questionIndex] = this.state.qrAnswer;
        this.props.changeAlert({
          type: 'info',
          message: 'Congrats! Found answer to question: ' + this.state.questionIndex
        })
        this.setState({questionIndex:null, qrAnswer:null}) 
        cookie.save('playerAnswers', JSON.stringify(this.state.playerAnswers), { path: '/'})
      }

      if (numPlayers > 0) {
        for (const i of playerList.keys()) {
          let data = await this.state.YourContract.getPlayerDataByIndex(i).call()
          let address = await this.state.YourContract.playerList(i).call()
          playerList[i] = {time: parseInt(data[0]), score: parseInt(data[1]), address: address.substring(0, 8)}
        }

        let sortBy = [{
          prop:'score',
          direction: -1
        },{
          prop:'time',
          direction: 1
        }];

        playerList.sort(function(a,b){
          let i = 0, result = 0;
          while(i < sortBy.length && result === 0) {
            result = sortBy[i].direction*(a[ sortBy[i].prop ].toString() < b[ sortBy[i].prop ].toString() ? -1 : (a[ sortBy[i].prop ].toString() > b[ sortBy[i].prop ].toString() ? 1 : 0));
            i++;
          }
          return result;
        })
      }

      if (toAddress && !this.props.web3.utils.isAddress(toAddress)) {
        this.parseQRCode(toAddress)
        toAddress = ""
      }

      this.setState({status, gameEndTime, revealEndTime, winner, isOwner, numQuestions, numPlayers, yourContractBalance,mainnetBlockNumber,xdaiBlockNumber, playerData, playerAnswers, timeRemaining, playerList, revealedAnswers, toAddress})
    }
  }

  savePlayerAnswer(questionIndex, answer) {
    this.state.playerAnswers[questionIndex] = answer;
    this.setState({questionIndex:null, qrAnswer:null})
    cookie.save('playerAnswers', JSON.stringify(this.state.playerAnswers), { path: '/'})
  }

  parseQRCode(qrCode) {
    let list = qrCode.split('&');
    if (list.length == 1) {
      // just contract
      let contract = list[0].split('=')[1]
      if (contract != this.state.contractAddress) {
        // reload new contract
        window.location.href = window.location.protocol + '//' + window.location.host + '?' + list.join();
      }
    } else if (list.length == 2) {
      // just q/a
      let q = list[0].split('=')[1]
      let a = list[1].split('=')[1]
      this.savePlayerAnswer(q, a)
    } else if (list.length === 1 || list.length === 3) {
      // contract and q/a
      let contract = list[0].split('=')[1]
      if (contract != this.state.contractAddress) {
        // reload new contract
        window.location.href = window.location.protocol + '//' + window.location.host + '?' + list.join('&');
      } else {
        // just load answer
        let q = list[1].split('=')[1]
        let a = list[2].split('=')[1]
        this.savePlayerAnswer(q, a)
      }
    }
  }

  async submitAnswer(question) {
    let answer = document.getElementById("question_" + question).value
    console.log('answer', answer)
    let hashedAnswer = await this.state.YourContract.getSaltedHash(this.props.web3.utils.utf8ToHex(answer), this.state.playerSalt).call();
    this.props.tx(this.state.YourContract.commitAnswer(hashedAnswer, question), 250000, 0, 0, (result)=> {
      console.log(result);
      this.props.changeAlert({
        type: 'info',
        message: 'Answer submitted'
      })
    })
  }
 
  async revealAnswer(question) {
    let answer = document.getElementById("answer_" + question).value
    console.log('answer', answer)
    this.props.tx(this.state.YourContract.revealAnswer(this.props.web3.utils.utf8ToHex(answer), question, this.state.playerSalt), 250000, 0, 0, (result)=> {
      console.log('revealAnswer', result)
      this.props.changeAlert({
        type: 'info',
        message: 'Revealed Answer'
      })
    })
  }

  clicked(name){
    console.log("clicked: ", name)
    let ownerAnswers = this.state.ownerAnswers
    switch (name) {
      case "ownerView":
        cookie.save('playerAnswers', JSON.stringify(this.state.playerAnswers), { path: '/'})
        this.setState({view: name});
        break;
      case "playerView":
        cookie.save('ownerAnswers', JSON.stringify(this.state.ownerAnswers), { path: '/'})
        this.setState({view: name});
      break;
      case "leaderBoardView":
        if (this.state.view == "ownerView") {
          cookie.save('ownerAnswers', JSON.stringify(this.state.ownerAnswers), { path: '/'})
        } else {
          cookie.save('playerAnswers', JSON.stringify(this.state.playerAnswers), { path: '/'})
        }
        this.setState({view: name});
        break;
      case "endGame":
        let answers = [];
        for (let i = 0; i < this.state.numScavengerAnswers; i++ ) {
          answers.push(this.props.web3.utils.utf8ToHex(document.getElementById("scavengerAnswer_" + i).value))
        }
        let revealEndTime = parseInt(document.getElementById("revealEndTime").value)
        console.log(answers, this.state.ownerSalt, revealEndTime)

        if (revealEndTime > 0) {
          this.props.tx(this.state.YourContract.endGame(answers, this.state.ownerSalt, revealEndTime), 1000000, 0, 0, (result)=> {
            this.props.changeAlert({
              type: 'info',
              message: 'Reveal Stage started'
            })
          })
        } else {
          this.props.changeAlert({
            type: 'danger',
            message: 'Revaeal EndTime must be greater than 0'
          })
        }
        break;
      case "findWinner":
        this.props.tx(this.state.YourContract.findWinner(), 1000000, 0, 0, (result)=> {
          console.log(result)
          this.props.changeAlert({
            type: 'info',
            message: 'Found Winner'
          })
        })
        break;
      case "removeAnswer":
        if (this.state.numScavengerAnswers > 1) this.setState({numScavengerAnswers: this.state.numScavengerAnswers - 1})
        ownerAnswers.pop();
        this.setState({ownerAnswers})
        break;
      case "addAnswer":
        this.setState({numScavengerAnswers: this.state.numScavengerAnswers + 1})
        ownerAnswers.push("")
        this.setState({ownerAnswers})
        break;
      default: console.log("secondary button "+name+" was clicked")
    }
  }

  handleAnswerChange(index, event) {
    let inputValue = event.target.value;
    this.setState(state => {
      const playerAnswers = this.state.playerAnswers.map((item, j) => {
        if (j === index) {
          return inputValue
        } else {
          return item;
        }
      });

      return {
        playerAnswers,
      };
    });
    cookie.save('playerAnswers', JSON.stringify(this.state.playerAnswers), { path: '/'})
  }

  handleOwnerAnswerChange(index, event) {
    let inputValue = event.target.value;

    this.setState(state => {
      const ownerAnswers = this.state.ownerAnswers.map((item, j) => {
        if (j === index) {
          return inputValue
        } else {
          return item;
        }
      });

      return {
        ownerAnswers,
      };
    });
    cookie.save('ownerAnswers', JSON.stringify(this.state.ownerAnswers), { path: '/'})
  }

  hashAnswer(answer, salt) {
    return this.props.web3.utils.soliditySha3(this.props.web3.eth.abi.encodeParameters(['bytes32','bytes32'], [answer, salt]))
  }

  deployYourContract() {
    console.log("Deploying YourContract...")
    //
    //  as noted above you need src/contracts/YourContract.bytecode.js
    //  to be there for this to work:
    //

    // Get answers and hash
    let hashedAnswers = [];
    let ownerAnswer = [];
    for (let i = 0; i < this.state.numScavengerAnswers; i++ ) {
      let scavengerAnswer = document.getElementById("scavengerAnswer_" + i).value
      hashedAnswers.push(this.hashAnswer(this.props.web3.utils.utf8ToHex(scavengerAnswer), this.state.ownerSalt))
      ownerAnswer.push(scavengerAnswer)
    }

    cookie.save('ownerAnswers', JSON.stringify(ownerAnswer), { path: '/'})

    let gameEndTime = parseInt(document.getElementById("gameEndTime").value)
    console.log(hashedAnswers)
    
    if (gameEndTime > 0) {
      // Deploy new contract with new params
      let code = require("../contracts/ScavengerHunt.bytecode.js")
      this.props.tx(this.state.YourContract._contract.deploy({data:code, arguments:[hashedAnswers, gameEndTime]}),2000000,(receipt)=>{
        let yourContract = this.props.contractLoader("ScavengerHunt",receipt.contractAddress)
        this.setState({ YourContract: yourContract})
        this.props.changeAlert({
          type: 'info',
          message: 'New Scavenger Hunt deployed'
        })

        let pot = parseFloat(document.getElementById("scavengerPot").value)
        if (pot > 0) {
          let toAddress = this.state.YourContract._address
          this.props.send(toAddress, pot, 120000,"0x00", (result) => {
            if(result && result.transactionHash){
              console.log("RESULT&&&#&#&#&# ",result)
              this.props.changeAlert({
                type: 'info',
                message: `Pot deposited ${pot}`
              })
            }
          })
        }
      })
    } else {
      this.props.changeAlert({
        type: 'danger',
        message: 'Game End Time must be greater than 0'
      })
      return false;
    }
  }
  render(){



    if(!this.state.YourContract){
      return (
        <div>
          LOADING YOURCONTRACT...
        </div>
      )
    }

    let url = window.location.protocol+"//"+window.location.hostname
    if(window.location.port&&window.location.port!=80&&window.location.port!=443){
      url = url+":"+window.location.port
    }
    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = url+"/"

    let showingQr = ""
    if(this.state.showingQr){
      return (
      <div>
        <div style={{position:'absolute',right:20,fontSize:32,top:72,cursor:'pointer',zIndex:2,padding:3}} onClick={()=>{this.setState({showingQr: ""})}}>
          <i style={{color:"#000000"}} className="fas fa-times" />
        </div>
        <div className="main-card card w-100" style={{zIndex:1}}>
          <Share
            title={this.state.showingQr}
            url={this.state.showingQr}
            changeAlert={this.props.changeAlert}
          />
        </div>
      </div>
      )
    }

    const questions = [];
    const answers = [];
    const scavengerAnswers = [];
    const leaderBoard = [];

    // submit answers
    for (let i = 0; i < this.state.numQuestions; i++) {
      questions.push(<div className="content bridge row" key={i}>
      <div className="input-group">
        <div className="col-6 p-1">
        <div>
        <input type="text" className="form-control" placeholder={"Question " + i} id={"question_" + i} onChange={this.handleAnswerChange.bind(this, i)}
          value={this.state.playerAnswers[i]}
        /></div>
        </div>
        <div className="col-6 p-1">
        <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={this.submitAnswer.bind(this,i)}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-dog"></i> {"Submit Question " + i}
          </Scaler>
        </button>
        </div>
      </div>
    </div>)
    }

    // reveal answers
    for (let i = 0; i < this.state.numQuestions; i++) {
      answers.push(<div className="content bridge row" key={i}>
      <div className="input-group">
        <div className="col-6 p-1">
        <div>
        <input type="text" className="form-control" placeholder={"Enter Answer " + i} id={"answer_" + i} onChange={this.handleAnswerChange.bind(this, i)}
          value={this.state.playerAnswers[i]}
        /></div>
        </div>
        <div className="col-6 p-1">
        {this.props.web3.utils.hexToString(this.state.status) == "Reveal" && this.state.revealedAnswers.length > 0 &&
          this.state.playerAnswers.length > 0 && this.state.playerAnswers[i] &&
           this.state.playerAnswers[i] === this.props.web3.utils.hexToString(this.state.revealedAnswers[i]) ? (
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={this.revealAnswer.bind(this,i)}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-dog"></i> {"Reveal Anwesr " + i}
                </Scaler>
              </button>) : this.state.revealedAnswers.length > 0 && this.state.playerAnswers.length > 0 ? (<span>Correct Answer: {this.props.web3.utils.hexToString(this.state.revealedAnswers[i])}</span>) : (<span>Loading</span>)
        }
        </div>
      </div>
    </div>)
    }

    // Owner answers
    for (let i = 0; i < this.state.numScavengerAnswers; i++) {
      scavengerAnswers.push(<div className="content bridge row" key={i}>
      <div className="input-group">
        <div className="col-8 p-1">
          <div>
            <input type="text" className="form-control" placeholder={"Enter Scavenger Answer " + i} id={"scavengerAnswer_" + i} onChange={this.handleOwnerAnswerChange.bind(this, i)}
            value={this.state.ownerAnswers[i]} />
          </div>
        </div>
        <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}
                  onClick={()=>{
                    this.setState({showingQr:`${url}/?game=${this.state.YourContract._address}&q=${i}&a=${this.state.ownerAnswers[i]}`})
                  }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-qrcode"/> {i18n.t('advanced.to_qr')}
            </Scaler>
          </button>
        </div>
      </div>
    </div>)
    }

    // Leaderboard
    for (let i = 0; i < this.state.numPlayers; i++) {
      leaderBoard.push(<div className="content bridge row" key={i}>
      <div className="input-group">
        <div className="col-5 p-1">
          <div>{this.state.playerList[i].address}</div>
        </div>
        <div className="col-3 p-1">
          <div>{this.state.playerList[i].score}</div>
        </div>
        <div className="col-3 p-1">
          <div>{new Date(this.state.playerList[i].time*1000).toTimeString().slice(0,8)}</div>
        </div>
      </div>
    </div>)
    }

    return (
      <div className="your-module">
        <div className="form-group w-100">
            <div className="content bridge row">
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.state.view === 'ownerView' ? this.props.buttonStyle.primary: this.props.buttonStyle.secondary} onClick={()=>{
                this.clicked('ownerView')}
              }>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-bell"></i> {"Owner"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
            <button className="btn btn-large w-100" style={this.state.view === 'playerView' ? this.props.buttonStyle.primary: this.props.buttonStyle.secondary} onClick={()=>{
              this.clicked('playerView')}
            }>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"></i> {"Player"}
              </Scaler>
            </button>
            </div>
            <div className="col-4 p-1">
            <button className="btn btn-large w-100" style={this.state.view === 'leaderBoardView' ? this.props.buttonStyle.primary: this.props.buttonStyle.secondary} onClick={()=>{
              this.clicked("leaderBoardView")
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                 {"Leader Board"}
              </Scaler>
            </button>
            </div>
          </div>

          <div style={{width:"100%",textAlign:"center"}}>
            SCAVENGER HUNT Game:<br/> 
            {this.state.YourContract._address} 
            {this.props.web3.utils.hexToString(this.state.status) == "Start" &&
            <div>
              Game End Time: {(new Date(this.state.gameEndTime * 1000)).toString()}
            </div>
            }
            {this.props.web3.utils.hexToString(this.state.status) == "Reveal" &&
              <div>
                Reveal End Time: {(new Date(this.state.revealEndTime * 1000)).toString()} 
              </div>
            }

            <Ruler/>
            <div className="content bridge row">
                <div className="col-6 p-1">
                  <div style={{width:"100%",textAlign:"center"}}>
                    <div>
                      The logged in user is
                      <Blockie
                        address={this.props.address}
                        config={{size:6}}
                      />
                      {this.props.address.substring(0,8)}
                      <div>
                        {this.props.dollarDisplay(this.props.balance)}<img src={this.props.xdai} style={{maxWidth:22,maxHeight:22}}/>
                      </div>
                      <div>
                        {this.props.dollarDisplay(this.props.daiBalance)}<img src={this.props.dai} style={{maxWidth:22,maxHeight:22}}/>
                      </div>
                      <div>
                        {this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}<img src={this.props.eth} style={{maxWidth:22,maxHeight:22}}/>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6 p-1">
                  <div>
                    <h3>Status: {this.props.web3.utils.hexToString(this.state.status)} </h3>
                  </div>
                  <div>
                    <h3>Pot: {this.props.dollarDisplay(this.state.yourContractBalance)}</h3>
                  </div>
                  <div>
                    <h4>Number of Questions: {this.state.numQuestions} </h4>
                  </div>
                  <div>
                    <h4>Time Left: {this.state.timeRemaining.hours}:{this.state.timeRemaining.minutes}:{this.state.timeRemaining.seconds} </h4>
                  </div>
                  <div>
                    <h4>Num Players: {this.state.numPlayers}</h4>
                  </div>
                  <div>
                    <h4>Player Score: {this.state.playerData[1] ? this.state.playerData[1] : 0} </h4>
                  </div>
                </div>
            </div>
            
            {/* <div>
              Network {this.props.network} is selected and on block #{this.props.block}.
            </div>
            <div>
              Gas price on {this.props.network} is {this.props.gwei} gwei.
            </div>
            <div>
              mainnetweb3 is on block {this.state.mainnetBlockNumber} and version {this.props.mainnetweb3.version}
            </div>
            <div>
              xdaiweb3 is on block {this.state.xdaiBlockNumber} and version {this.props.xdaiweb3.version}
            </div>
            <div>
              The current price of ETH is {this.props.dollarDisplay(this.props.ethprice)}.
            </div> */}

            { this.state.view == "ownerView" ? (
              //////////////////////////////////////////////////////////////////////////////////////////////
              // Owner View
              //////////////////////////////////////////////////////////////////////////////////////////////
              <div>
                <Ruler/>
                
                <div className="content bridge row">
                  <div className="col-6 p-1">
                    <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                      this.clicked("removeAnswer")
                    }}>
                      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                        <i className="fas fa-minus"></i> {"Remove Answer"}
                      </Scaler>
                    </button>
                  </div>
                  <div className="col-6 p-1">
                    <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                      this.clicked("addAnswer")
                    }}>
                      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                        <i className="fas fa-plus"></i> {"Add Answer"}
                      </Scaler>
                    </button>
                  </div>
                </div>

                {scavengerAnswers}

                <div className="content bridge row">
                  <div className="col-12 p-1">
                    <div>
                      <input type="text" className="form-control" placeholder={"Game End Time in Seconds"} id={"gameEndTime"} />
                    </div>
                  </div>
                  <div className="col-12 p-1">
                    <div>
                      <input type="text" className="form-control" placeholder={"Scavenger Pot Amount"} id={"scavengerPot"} />
                    </div>
                  </div>
                  <div className="col-12 p-1">
                    <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} onClick={this.deployYourContract.bind(this)}>
                      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                        <i className="fas fa-rocket"></i> {"Deploy Scavenger"}
                      </Scaler>
                    </button>
                  </div>
                </div>

                <Ruler/>

                <div className="content bridge row">
                    <div className="col-12 p-1">
                      <div>
                        <input type="text" className="form-control" placeholder={"Reveal End Time in Seconds"} id={"revealEndTime"} />
                      </div>
                    </div>
                    <div className="col-12 p-1">
                      <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} onClick={() => {
                        this.clicked("endGame")
                      }}>
                        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                          <i className="fas fa-rocket"></i> {"End Game"}
                        </Scaler>
                      </button>
                    </div>
                </div>

                <Ruler/>

                <div className="content bridge row">
                    <div className="col-12 p-1">
                      <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} onClick={() => {
                        this.clicked("findWinner")
                      }}>
                        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                          <i className="fas fa-rocket"></i> {"Find Winner"}
                        </Scaler>
                      </button>
                    </div>
                </div>

              </div>

            ) : this.state.view == "playerView" ? (
              //////////////////////////////////////////////////////////////////////////////////////////////
              // Player View
              //////////////////////////////////////////////////////////////////////////////////////////////
              <div>
              {this.props.web3.utils.hexToString(this.state.status) == "Game Over" &&
                  <h4 style={{backgroundColor: "#F76B1C", color:"#FFFFFF"}}>Winner: {this.state.winner} </h4>
                }
              {(this.props.web3.utils.hexToString(this.state.status) == "Start") ? questions : answers}
              
              <Ruler/>

              <div className="content row">
                <div className="col-12 p-1">
                  <div className="input-group" style={{width:"100%",textAlign:"center", display:"inline-block"}}>
                    <input type="hidden" className="form-control" placeholder="0x..." value={this.state.toAddress}
                      ref={(input) => { this.addressInput = input; }}
                      onChange={event => this.updateState('toAddress', event.target.value)}
                    />
                    <div className="input-group-append" onClick={() => {
                      this.props.openScanner({view:"scavengerhunt"})
                    }} style={{display:"inline-block"}}>
                      <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                        <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
                        <span style={{marginLeft:"10px"}}>{"SCAN FOUND ANSWER QR CODES"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              </div>
            ) : (
              //////////////////////////////////////////////////////////////////////////////////////////////
              // Leaderboard View
              ////////////////////////////////////////////////////////////////////////////////////////////// 
              <div>
                <h3>Leader Board</h3>
                {this.props.web3.utils.hexToString(this.state.status) == "Game Over" &&
                  <h4 style={{backgroundColor: "#F76B1C", color:"#FFFFFF"}}>Winner: {this.state.winner} </h4>
                }
                <div className="content bridge row">
                  <div className="input-group">
                    <div className="col-5 p-1">
                      <h5>Player</h5>
                    </div>
                    <div className="col-3 p-1">
                      <h5>Score</h5>
                    </div>
                    <div className="col-3 p-1">
                      <h5>Time</h5>
                    </div>
                  </div>
                </div>

                {leaderBoard}

              <Ruler/>
              </div>
            )
            }

          </div>

          <Ruler/>

          <div className="content bridge row">
            <div className="col-2 p-1"></div>
            <div className="col-8 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                let toAddress = this.state.YourContract._address
                let amount = "1"
                this.props.send(toAddress, amount, 120000,"0x00", (result) => {
                  if(result && result.transactionHash){
                    console.log("RESULT&&&#&#&#&# ",result)
                  }
                })
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-circle-down"></i> {"Deposit 1 to pot"}
                </Scaler>
              </button>
            </div>
            <div className="col-2 p-1"></div>
          </div>
          <div className="content bridge row">
            <div className="col-4 p-1">
            </div>
            <div className="col-4 p-1">
            <div style={{padding:15,textAlign:'center'}}>
              Your contract is
              <Blockie
                address={this.state.YourContract._address}
                config={{size:3}}
              />
              {this.state.YourContract._address.substring(0,8)}

              <div style={{padding:5}}>
                it has {this.props.dollarDisplay(this.state.yourContractBalance)}
              </div>

              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}
                  onClick={()=>{
                    this.setState({showingQr:`${url}/?game=${this.state.YourContract._address}`})
                  }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-qrcode"/> {i18n.t('advanced.to_qr')}
                </Scaler>
              </button>

            </div>
            </div>
            <div className="col-4 p-1"> </div>
          </div>
        </div>
      </div>
   )
  }
}
