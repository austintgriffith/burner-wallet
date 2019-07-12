const configs = [
  {
    DOMAINS: ["localhost", "10.0.0.107", "sundai.fritz.box"],
    CURRENCY: {
      EXCHANGE_RATE_QUERY: 5000,
      CURRENCY_LIST: ["EUR", "USD", "GBP"],
      DEFAULT_CURRENCY: "USD"
    },
    SIDECHAIN: {
      NAME: "Leap Testnet",
      RPC: "https://testnet-node.leapdao.org",
      DAI_ADDRESS: "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98",
      MARKET_MAKER:
        "https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet",
      BRIDGE_ADDRESS: "0x26a937302cc6A0A7334B210de06136C8C61BA885",
      EXPLORER: {
        URL: "https://testnet.leapdao.org/explorer/",
        NAME: "LeapDAO Testnet Explorer"
      },
      TIME_ESTIMATES: {
        // TODO: For Plasma implementations, EXIT (and specifically fast exits)
        // is dependent on how often blocks are submitted to the network.
        // Ultimately, we want to remove this value from the code base somehow.
        EXIT: 160000,
        DEPOSIT: 330000,
        TX: 1000,
      }
    },
    ROOTCHAIN: {
      RPC: "https://rinkeby.infura.io/v3/f039330d8fb747e48a7ce98f51400d65",
      DAI_ADDRESS: "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98",
      GAS: {
        BOOST_BY: 0.25
      },
      TIME_ESTIMATES: {
        SEND: 160000
      },
      UNISWAP: {
        DAI_ETH_ADDRESS: "0x09cabec1ead1c0ba254b09efb3ee13841712be14"
      }
    }
  },
  {
    DOMAINS: ["s.peep.cash"],
    CURRENCY: {
      EXCHANGE_RATE_QUERY: 5000,
      CURRENCY_LIST: ["EUR", "USD", "GBP"],
      DEFAULT_CURRENCY: "USD"
    },
    SIDECHAIN: {
      NAME: "Leap Testnet",
      RPC: "https://testnet-node.leapdao.org",
      DAI_ADDRESS: "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98",
      MARKET_MAKER:
        "https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet",
      BRIDGE_ADDRESS: "0x26a937302cc6A0A7334B210de06136C8C61BA885",
      EXPLORER: {
        URL: "https://testnet.leapdao.org/explorer/",
        NAME: "LeapDAO Testnet Explorer"
      },
      TIME_ESTIMATES: {
        // TODO: For Plasma implementations, EXIT (and specifically fast exits)
        // is dependent on how often blocks are submitted to the network.
        // Ultimately, we want to remove this value from the code base somehow.
        EXIT: 160000,
        DEPOSIT: 330000,
        TX: 1000,
      }
    },
    ROOTCHAIN: {
      RPC: "https://rinkeby.infura.io/v3/f039330d8fb747e48a7ce98f51400d65",
      DAI_ADDRESS: "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98",
      GAS: {
        BOOST_BY: 0.25
      },
      TIME_ESTIMATES: {
        SEND: 160000
      },
      UNISWAP: {
        DAI_ETH_ADDRESS: "0x09cabec1ead1c0ba254b09efb3ee13841712be14"
      }
    }
  },
  {
    DOMAINS: ["peep.cash"],
    CURRENCY: {
      EXCHANGE_RATE_QUERY: 5000,
      CURRENCY_LIST: ["EUR", "USD", "GBP"],
      DEFAULT_CURRENCY: "USD"
    },
    SIDECHAIN: {
      NAME: "Leap Network",
      RPC: "wss://mainnet-node1.leapdao.org:1443",
      DAI_ADDRESS: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
      MARKET_MAKER:
        "https://k238oyefqc.execute-api.eu-west-1.amazonaws.com/mainnet",
      BRIDGE_ADDRESS: "0x495AeB6FD65D39AA49482a938b85f7A70b075750",
      EXPLORER: {
        URL: "https://mainnet.leapdao.org/explorer/",
        NAME: "LeapDAO Mainnet Explorer"
      },
      TIME_ESTIMATES: {
        // TODO: For Plasma implementations, EXIT (and specifically fast exits)
        // is dependent on how often blocks are submitted to the network.
        // Ultimately, we want to remove this value from the code base somehow.
        EXIT: 160000,
        DEPOSIT: 330000,
        TX: 1000,
      }
    },
    ROOTCHAIN: {
      RPC: "wss://mainnet.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65",
      DAI_ADDRESS: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
      GAS: {
        BOOST_BY: 0.25
      },
      TIME_ESTIMATES: {
        SEND: 160000
      },
      UNISWAP: {
        DAI_ETH_ADDRESS: "0x09cabec1ead1c0ba254b09efb3ee13841712be14"
      }
    }
  }
];

function findConfig(hostname) {
  return configs.filter(({ DOMAINS }) => DOMAINS.includes(hostname));
}

export default function getConfig() {
  const hostname = window.location.hostname;

  const config = findConfig(hostname);
  if (config.length === 1) {
    return config[0];
  } else {
    throw new Error("Cannot find distinct config for this domain");
  }
}
