import { eth, dai, xdai, ERC20Asset } from '@burner-wallet/assets';
import burnerlogo from './burnerwallet.png';
import bufficorn from './bufficorn.png';

export const assets = [xdai, dai, eth];
export let token = null;
export let WEB3_PROVIDER = 'https://dai.poa.network';
export let ERC20IMAGE;
export let LOADERIMAGE = burnerlogo;
export let XDAI_PROVIDER = 'https://dai.poa.network'


if (window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("10.0.0.107") >= 0) {
  XDAI_PROVIDER = "http://localhost:8545"
  WEB3_PROVIDER = "http://localhost:8545";
  ERC20IMAGE = false
} else if (window.location.hostname.indexOf("wallet.galleass.io") >= 0) {
  WEB3_PROVIDER = "http://localhost:8545"
  document.domain = 'galleass.io'
} else if (window.location.hostname.indexOf("buffidai") >= 0) {
  token = new ERC20Asset({
    id: 'buff',
    name: 'BUFF',
    network: '100',
    address: '0x3e50bf6703fc132a94e4baff068db2055655f11b',
    usdPrice: 1,
  });

  ERC20IMAGE = bufficorn
  LOADERIMAGE = bufficorn
}
