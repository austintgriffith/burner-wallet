import BurnerCore from '@burner-wallet/core';
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/src/signers';
import { InfuraGateway, InjectedGateway, XDaiGateway } from '@burner-wallet/core/src/gateways';
import { eth, dai, xdai, ERC20Asset } from '@burner-wallet/assets';
import localTokenAddress from './contracts/ERC20Vendable.address.js';

// TODO: Move all keys to env variable
const infuraKey = 'e0ea6e73570246bbb3d4bd042c4b5dac';

const injectedGateway = new InjectedGateway();
const isGanache = injectedGateway.isAvailable() && injectedGateway.getNetworks()[0] === '5777';

const localToken = new ERC20Asset({
  id: 'testxdai',
  name: 'Test xDai',
  network: '5777',
  address: localTokenAddress,
  usdPrice: 1,
});

export const mainAsset = isGanache ? localToken : xdai;

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner()],
  gateways: [
    injectedGateway,
    new InfuraGateway(infuraKey),
    new XDaiGateway(),
  ],
  assets: [mainAsset, dai, eth],
});

export default core;
