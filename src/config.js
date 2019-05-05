import bufficorn from './bufficorn.png';
import cypherpunk from './cypherpunk.png';
import burnerlogo from './burnerwallet.png';



export const POA_XDAI_NODE = "https://dai.poa.network";
export const DOLLAR_SYMBOL = "$"

export let XDAI_PROVIDER = POA_XDAI_NODE;
export let LOADERIMAGE = burnerlogo;

export let WEB3_PROVIDER;
export let CLAIM_RELAY;
export let ERC20TOKEN;
export let ERC20VENDOR;
export let ERC20IMAGE;
export let ERC20NAME;



if (window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("10.0.0.107") >= 0) {
  XDAI_PROVIDER = "http://localhost:8545"
  WEB3_PROVIDER = "http://localhost:8545"
  CLAIM_RELAY = 'http://localhost:18462'
  if(false){
    ERC20NAME = false
    ERC20TOKEN = false
    ERC20IMAGE = false
  }else{
    ERC20NAME = 'RAD'
    ERC20VENDOR = 'VendingMachine'
    ERC20TOKEN = 'ERC20Vendable'
    ERC20IMAGE = "🍕"
    XDAI_PROVIDER = "http://localhost:8545"
    WEB3_PROVIDER = "http://localhost:8545";
    LOADERIMAGE = ""
  }

}
else if (window.location.hostname.indexOf("s.xdai.io") >= 0) {
  WEB3_PROVIDER = POA_XDAI_NODE;
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = false//'Burner'
}
else if (window.location.hostname.indexOf("wallet.galleass.io") >= 0) {
  //WEB3_PROVIDER = "https://rinkeby.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac";
  WEB3_PROVIDER = "http://localhost:8545"
  //CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = false//'Burner'
  document.domain = 'galleass.io'
}
else if (window.location.hostname.indexOf("qreth") >= 0) {
  WEB3_PROVIDER = "https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac"
  CLAIM_RELAY = false
  ERC20TOKEN = false
}
else if (window.location.hostname.indexOf("xdai") >= 0) {
  WEB3_PROVIDER = POA_XDAI_NODE;
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = false
}
else if (window.location.hostname.indexOf("buffidai") >= 0) {
  WEB3_PROVIDER = POA_XDAI_NODE;
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20NAME = 'BUFF'
  ERC20VENDOR = 'VendingMachine'
  ERC20TOKEN = 'ERC20Vendable'
  ERC20IMAGE = bufficorn
  LOADERIMAGE = bufficorn
}
else if (window.location.hostname.indexOf("burnerwallet.io") >= 0) {
  WEB3_PROVIDER = POA_XDAI_NODE;
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20NAME = 'BURN'
  ERC20VENDOR = 'BurnerVendor'
  ERC20TOKEN = 'Burner'
  ERC20IMAGE = cypherpunk
  LOADERIMAGE = cypherpunk
}
else if (window.location.hostname.indexOf("burnerwithrelays") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  ERC20NAME = false
  ERC20TOKEN = false
  ERC20IMAGE = false
} else {
  WEB3_PROVIDER = "https://dai.poa.network";
  ERC20NAME = false
  ERC20TOKEN = false
  ERC20IMAGE = false
}
