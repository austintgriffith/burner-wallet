import BurnerCore from '@burner-wallet/core';
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/src/signers';
import { InfuraGateway, InjectedGateway, XDaiGateway } from '@burner-wallet/core/src/gateways';
import { eth, dai, xdai } from '@burner-wallet/assets';

// TODO: Move all keys to env variable
const infuraKey = 'e0ea6e73570246bbb3d4bd042c4b5dac';

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner()],
  gateways: [
    new InjectedGateway(),
    new InfuraGateway(infuraKey),
    new XDaiGateway(),
  ],
  assets: [xdai, dai, eth],
});

export default core;
