🔥 The [Burner Wallet](https://xdai.io) is a quick web wallet used to move small amounts of crypto quickly. On page load an Ethereum keypair is automatically generated and used to sign transactions with an incredibly simple interface. Sending funds is as easy as a QR code scan. 

💵 Burners are analogous to cash: quick and easy but less secure. You wouldn't stuff thousands of dollars in your pocket on the way out the door at night, don't trust a seed phrase in localstorage with more than you are willing to lose.

🏠 Don't forget to sweep funds to colder storage when you get home at night and burn your ephemeral keys!

💸 Press the `[Request]` button to instantly create a popup point-of-sale system and have a QR code to display in the window of your shop. Patrons can send you funds with [a simple scan in seconds](https://youtu.be/neZeaXAnkAg).

🏦 Press the `[Exchange]` button to move ETH or DAI that you sent to your burner into [xDai](https://poa.network/xdai). 

🔗 Press the `[Link]` button to send value in a link over chat or QR scan in person. We use a [decentralized meta transaction relay system](https://medium.com/tabookey/1-800-ethereum-gas-stations-network-for-toll-free-transactions-4bbfc03a0a56) so the receiving party doesn't need to have a wallet or gas to claim.

🗝️ If you would like more permanence, press the [Advanced] button and [use a short pass phrase](https://youtu.be/3zAFo-8p_tg?t=48) to seed a keypair. 

💬 Did you know there is also native, [burner-to-burner encrypted chat](https://www.youtube.com/watch?v=k1Ssz1dvcpk&feature=youtu.be&t=558)?

🌮 The Burner Wallet was [used at ETHDenver](https://medium.com/gitcoin/burner-wallet-at-ethdenver-was-faa3851ea833) by participants to purchase 4405 meals, we off-ramped $38,432.56 in DAI to the food trucks, and the total cost of transactions on [xDai](https://poa.network/xdai) was $0.20! 

🎭 We held a number of smaller events we called a [Cypherpunk Speakeasy](https://medium.com/@austin_48503/the-burner-wallet-challenge-cf90453aaf24) to demonstrate the tech and learn how to improve our user experience. 

🍻 If you are interested in hosting a Burner Wallet event, check out [Host to host a Burner Wallet event](https://medium.com/gitcoin/how-to-host-a-burner-wallet-event-53a429035a24). 

🎫 Using [paper wallets](https://github.com/austintgriffith/paper-wallet), [ether.cards](https://ether.cards/), or solidcoins, users can be instantly onboarded into a wallet and have tokens or localcoins to purchase goods or services. 

🤑 We are finding that the Burner is becoming more of an instant onboarding platform for apps. I built Emojicoin.Exchange in an afternoon and [launched it](https://medium.com/gitcoin/emojicoin-exchange-53f9658c9e3b) to a room of students. They could immediately start interacting with a smart contract without any app download or seed phrase. We also played this game [live with Crypto Twitter](https://www.youtube.com/watch?v=RSyuKNoMPkA) and again at [ETHNewYork](https://ethnewyork.io). 

🤔 At Ethereal we did the usual food truck tokens, but participants could also [bet on prediction markets](https://medium.com/@austin_48503/burner-wallet-ethereal-was-rad-bf56b68ac3bc) while they waited in line for food. 

🔧 If you are interested in building a Dapp or game on the Burner Wallet, a great place to start is exploring [Burner Module Development](https://medium.com/gitcoin/burner-modules-c6737cf06fe). 

🔏 A great example of a new and exciting module is the [Gnosis Safe in the Burner Wallet](https://www.youtube.com/watch?v=ONlB-LK3D0g).

🧑‍🤝‍🧑 The [Burner Wallet Collective](https://burnerwallet.co) is forming around fundamental development on this repo toward a shared mission of building a cleaner more extensible burner wallet. [Join our telegram](https://t.me/joinchat/KByvmROSyXhuMESDUL5YVA) and [tackle some issues](https://github.com/austintgriffith/burner-wallet/issues) to earn a bounty reward!

✅ All projects should have a 'burner' version of their product. Take simple fundamentals from your app and put them in an easy to access web version before the barriers to entry. Use this to educate your users about your product and incentivized them to take the next step and download your app. 

🗺 The Burner Wallet all started while exploring the intersection of smooth UX and Frontier Markets. The theory is that [mass adoption will start where decentralization in necessary (emerging economies)](https://medium.com/@austin_48503/ethereum-in-emerging-economies-b235f8dac2f2).

✊ You can support our efforts by contributing to the [Burner Wallet Gitcoin Grant](https://gitcoin.co/grants/20/burner-wallet) or sending mainnet funds to [burnerwallet.eth](https://etherscan.io/address/0xda6a87d5d23cdfa286104119f0e406197ea387da)

🙏 Thanks! - Austin Griffith ( @austingriffith / austin@concurrence.io )

🛠️ If you are interested in contributing development to the Burner Wallet, read on...


### Contributing

assuming you have [nodejs](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) already installed...

you'll need ganache installed and running
```
npm install -g ganache-cli
ganache-cli
```

clone the burner wallet repo
```
git clone https://github.com/austintgriffith/burner-wallet.git
cd burner-wallet
```

initialize burner:
```
npx clevis init
```
(You'll need to hit enter a few times to specify some config directories.)

install burner:
```
npm i
```

link clevis 
```
alias clevis='./node_modules/clevis/bin.js'
```

compile, deploy, test, and inject all contracts in the frontend:
```
clevis test full
```

start the app:
```
npm run start-local
```

OR start the app on the xDai chain:
```
npm start
```

### Meta Transaction Relay (optional, not needed for regular dev)

in a new terminal start the decentralized metatx relayer from Tabookey:
```
./startLocalRelay.sh
```

then deploy and test 
```
clevis test withrelay
```


# Older Content and Videos:

[![burnerwalletvideosplash](https://user-images.githubusercontent.com/2653167/50697319-23033280-0fff-11e9-8891-77965ecf1fcf.jpg)](https://youtu.be/k1Ssz1dvcpk)


### WTF is Clevis? (It's like truffle and drizzle I think.)

Clevis is used to compile, deploy, and test the smart contracts. It is mainly for orchestration, but it also injects all the contracts into the Dapparatus (frontend). 

[clevis docs](https://github.com/austintgriffith/clevis):


### Testing locally

Take a look at `tests/clevis.js`, the `metamask()` function in particular, to give your MetaMask accounts some ETH when you run the full test.

# Original Video

[![burnerwalletscreencast](https://user-images.githubusercontent.com/2653167/48286964-83715b80-e424-11e8-9fc3-a1260bfb4a00.png)](https://youtu.be/KkOyrEvYqO8)

Here are two phones exchanging value in a matter of seconds using burners:

![burnerwalletdemo](https://user-images.githubusercontent.com/2653167/48271785-5dcf5c80-e3fa-11e8-98fb-143de75df7aa.gif)

One mobile phone can send DAI to another in 5 seconds with a simple QR code scan without any wallet download, this works on web browsers. Users can even send value through messaging services like WhatsApp with a simple link!

The Burner Wallet runs on the xDai sidechain from POA. Since it is in DAI, a dApp can simply refer to amounts in USD. Plus, block times take 5 seconds and gas costs are virtually abstracted because they are so cheap and paid in DAI. Finally, the bridge between xDai and DAI/ETH is as simple as sending tokens to a specific address. 

A burner wallet is automatically generated upon visiting https://xdai.io and your private key is stored in a cookie so it will be there when you come back. However, you should sweep any value you hold to a cold wallet regularly and burn your ephemeral private key. A burner wallet is analogous to cash; you won't carry too much because it can be lost but it's astonishingly easy to exchange. 

This can also be very handy in everyday use even for the crypto-initiated. If you are share a Lyft or a pizza with a friend and want to split the cost, just shoot their QR code with your camera and it will open up a new burner wallet to exchange value with them. Just don't forget to sweep to cold storage and burn your key when you get home!

Here is a follow up video to show how to go from fiat to DAI to xDai and back:
[![onrampscreencast](https://user-images.githubusercontent.com/2653167/48295187-cb08df00-e446-11e8-9506-ff74a6d19604.png)](https://youtu.be/sbHIyDMpqyY)

----------


#### Docker Dev Version

You will want to fork this repo and then clone it down. Since I own the repo I'll just clone it:
```
cd ~;git clone https://github.com/austintgriffith/burner-wallet.git
```

Then, fire up a Docker container with your environment all prepared for you:
```
docker run -ti --rm --name clevis -p 3000:3000 -p 8545:8545 -p 18462:18462 -v ~/burner-wallet:/dapp austingriffith/clevis:latest
```
Note: You will be prompted for directories to store things, just use the defaults (hit enter):
![image](https://user-images.githubusercontent.com/2653167/48425351-e4997780-e721-11e8-9228-f8e28d69704c.png)

This will take a while. Eventually it will stand up React, Ganache, and Clevis. (Note: make sure you don't have anything running on port 3000 or 8545 already)

If you visit http://localhost:3000 you will see an initial error that React is missing the injected contracts. To compile, deploy, and inject those contract, run:
```
🗜️ Clevis:/dapp 🗜️ clevis test full
```

Don't forget to point your MetaMask at the local RPC endpoint (http://localhost:8545):
![image](https://user-images.githubusercontent.com/2653167/48443559-c007c480-e74e-11e8-9c23-5421785a1016.png)

You can view and edit the code with your IDE of choice within the terminal (not from inside Docker container):
```
atom ~/burner-wallet
```

To bring up the relayer, you will want to set your http endpoint:
```
🗜️ Clevis:/dapp 🗜️ echo 'http://0.0.0.0:8545' > relayhttpprovider.env
🗜️ Clevis:/dapp 🗜️ node xdairelay.js
```

To follow your React logs you run:
```
tail -f react.log
```

To follow your ganache/geth logs:
```
tail -f geth.log
```

If you would like to give your intial account some eth to start out:
```
🗜️ Clevis:/dapp 🗜️ clevis send 5 0 ***YOUR_ETH_ADDRESS***
```

Or better yet, edit the tests/clevis.js to send you xDai every time you run the test suite:
![image](https://user-images.githubusercontent.com/2653167/48427338-c3d32100-e725-11e8-8751-fda17b113fad.png)

Then run:
```
clevis test full
```

Your frontend should automatically reload and your account should have xDai:
![image](https://user-images.githubusercontent.com/2653167/48427446-f54bec80-e725-11e8-9248-6f6cf9145a52.png)



--------

### Troubleshooting 

If you receive this error:
```
../../nan/nan.h:104:40: note: expanded from macro 'NAN_DEPRECATED'
# define NAN_DEPRECATED __attribute__((deprecated))
                                       ^
8 warnings and 7 errors generated.
make: *** [Release/obj.target/scrypt/src/node-boilerplate/scrypt_params_async.o] Error 1
gyp ERR! build error 
```

Try upgrading/downgrading your version of Node to `10.16.0`


### Older Contributing Content

Are you a developer or designer that would like to help build the next iteration of the 🔥👛Burner Wallet👛🔥? Here is a short intro video to explain how to get started:

[![onrampscreencast](https://user-images.githubusercontent.com/2653167/48449772-ee8e9b00-e760-11e8-93dd-ab2105a1c28d.png)](https://youtu.be/bAHluAuyLqo)

To learn more about Clevis and Dapparatus check out some of the following articles:

[https://github.com/austintgriffith/clevis](https://github.com/austintgriffith/clevis)
[https://github.com/austintgriffith/dapparatus](https://github.com/austintgriffith/dapparatus)
[https://medium.com/@austin_48503/buidlguidl-0x0-clevis-dapparatus-533936a8236a](https://medium.com/@austin_48503/buidlguidl-0x0-clevis-dapparatus-533936a8236a)
[https://medium.com/@austin_48503/buidlguidl-0x1-guidlcoin-3be30c6ac76f](https://medium.com/@austin_48503/buidlguidl-0x1-guidlcoin-3be30c6ac76f)
[https://medium.com/@austin_48503/%EF%B8%8Fclevis-blockchain-orchestration-682d2396aeef](https://medium.com/@austin_48503/%EF%B8%8Fclevis-blockchain-orchestration-682d2396aeef)





