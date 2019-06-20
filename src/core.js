import BurnerCore from '@burner-wallet/core';
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers';
import { InfuraGateway, InjectedGateway, XDaiGateway, HTTPGateway } from '@burner-wallet/core/gateways';
import { eth, dai, xdai, ERC20Asset } from '@burner-wallet/assets';
import localTokenAddress from './contracts/ERC20Vendable.address.js';

// TODO: Move all keys to env variable
const infuraKey = 'e0ea6e73570246bbb3d4bd042c4b5dac';

const signers = [new InjectedSigner(), new LocalSigner()];
const gateways = [new InjectedGateway(), new InfuraGateway(infuraKey)];
export let mainAsset = xdai;

if (process.env.REACT_APP_MODE === 'local') {
  mainAsset = new ERC20Asset({
    id: 'testxdai',
    name: 'Test xDai',
    network: '5777',
    address: localTokenAddress,
    usdPrice: 1,
  });
  gateways.push(new HTTPGateway('http://localhost:8545', '5777'));
} else {
  gateways.push(new XDaiGateway());
}

const assets = [mainAsset, dai, eth];

const core = new BurnerCore({ signers, gateways, assets });

export default core;
