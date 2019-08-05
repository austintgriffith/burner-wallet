import config from '../config/config.json';

export const getConfig = (prop) => config[prop] || {};
export const getCollateralToken = () => config.collateralToken.options.address;
