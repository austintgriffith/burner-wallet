🔥👛Burner Wallet to move xDai quickly in a web browser. Sweep to cold storage when you get home. 🏠👨🏻‍🚒 [https://xdai.io](https://xdai.io)

Read the full article here:
[Ethereum in Emerging Economies - Mass adoption will start where decentralization is necessary](https://medium.com/@austin_48503/ethereum-in-emerging-economies-b235f8dac2f2)


There are places in the world today where it's hard to find important goods with the traditional currency or the currency may fluctuate immensely in value due to inflation. Luckily, exchange of value is one of our most powerful assets in the Ethereum space. 

Unfortunately, it is especially difficult to onboard new users because our ecosystem has such a steep learning curve. Traditional wallets put a huge burden on the user to understand a new currency and deal with seed phrases.

What we need is a way to exchange an intuitive currency like DAI using a simple and ubiquitous platform like the mobile web browser.

[![burnerwalletvideosplash](https://user-images.githubusercontent.com/2653167/50697319-23033280-0fff-11e9-8891-77965ecf1fcf.jpg)](https://youtu.be/k1Ssz1dvcpk)

### Contributing as a Developer/Designer

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


in a new terminal install and fire up ganache:
```
ganache-cli
```

in a new terminal start the app:
```
npm start
```

in a new terminal start the decentralized metatx relayer from Tabookey:
```
startLocalRelay.sh
```

you probably want to have a bin alias for clevis in your .bashrc or .profile as mentioned in the [clevis docs](https://github.com/austintgriffith/clevis):
```
alias clevis='./node_modules/clevis/bin.js'
```

in a new terminal compile and deploy all contracts:
```
clevis test full
```

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



Are you a developer or designer that would like to help build the next iteration of the 🔥👛Burner Wallet👛🔥? Here is a short intro video to explain how to get started:

[![onrampscreencast](https://user-images.githubusercontent.com/2653167/48449772-ee8e9b00-e760-11e8-93dd-ab2105a1c28d.png)](https://youtu.be/bAHluAuyLqo)

To learn more about Clevis and Dapparatus check out some of the following articles:

[https://github.com/austintgriffith/clevis](https://github.com/austintgriffith/clevis)
[https://github.com/austintgriffith/dapparatus](https://github.com/austintgriffith/dapparatus)
[https://medium.com/@austin_48503/buidlguidl-0x0-clevis-dapparatus-533936a8236a](https://medium.com/@austin_48503/buidlguidl-0x0-clevis-dapparatus-533936a8236a)
[https://medium.com/@austin_48503/buidlguidl-0x1-guidlcoin-3be30c6ac76f](https://medium.com/@austin_48503/buidlguidl-0x1-guidlcoin-3be30c6ac76f)
[https://medium.com/@austin_48503/%EF%B8%8Fclevis-blockchain-orchestration-682d2396aeef](https://medium.com/@austin_48503/%EF%B8%8Fclevis-blockchain-orchestration-682d2396aeef)
