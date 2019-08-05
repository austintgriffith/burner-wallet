import Helena from '@frontier-token-research/pm-js';
import olympiaArtifacts from '@gnosis.pm/olympia-token';

const NETWORK_TIMEOUT = 10000;

export const {
  calcLMSRCost,
  calcLMSROutcomeTokenCount,
  calcLMSRMarginalPrice,
  calcLMSRProfit
} = Helena;

let helenaInstance;
let helenaROInstance;

const addOlympiaContracts = async (helenaJsInstance) => {
  await helenaJsInstance.importContracts(olympiaArtifacts, {
    OlympiaToken: 'olympiaToken',
    AddressRegistry: 'olympiaAddressRegistry',
    RewardClaimHandler: 'rewardClaimHandler'
  });
};

const waitForHelenaConnection = (instance) =>
  new Promise((resolve, reject) => {
    let stillRunning = true;
    const instanceCheck = setInterval(() => {
      if (instance) {
        stillRunning = false;
        clearInterval(instanceCheck);
        return resolve(instance);
      }
    }, 50);

    setTimeout(() => {
      if (stillRunning) {
        clearInterval(instanceCheck);
        reject(new Error('Connection to RO Helena.js timed out'));
      }
    }, NETWORK_TIMEOUT);
  });

export const initHelenaConnection = async () => {
  try {
    const opts = {};
    opts.ethereum = window.web3.currentProvider;
    const helena = await Helena.create(opts);

    await addOlympiaContracts(helena);

    helenaInstance = helena;

    if (process.env.NODE_ENV === 'development') {
      window.helena = helenaInstance;
    }

    console.info('Helena Integration: connection established'); // eslint-disable-line no-console
  } catch (err) {
    console.error('Helena Integration: connection failed'); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }
};

export const initReadOnlyHelenaConnection = async () => {
  try {
    const opts = {};
    opts.ethereum = window.web3.currentProvider;
    const helena = await Helena.create(opts);

    await addOlympiaContracts(helena);

    helenaROInstance = helena;

    if (process.env.NODE_ENV === 'development') {
      window.helenaRO = helenaROInstance;
    }

    console.info('helena RO Integration: connection established'); // eslint-disable-line no-console
  } catch (err) {
    console.error('helena RO Integration: connection failed'); // eslint-disable-line no-console
    console.error(err); // eslint-disable-line no-console
  }
};

export const getHelenaConnection = async () => {
  if (helenaInstance) {
    return helenaInstance;
  }

  return waitForHelenaConnection(helenaInstance);
};

export const getROHelenaConnection = async () => {
  if (helenaROInstance) {
    return helenaROInstance;
  }

  return waitForHelenaConnection(helenaROInstance);
};

export default Helena;
