import HttpService from './Http';
import PMService from './PM';
import { getConfig } from '../utils/config';
import Web3Service from './Web3';
import HelenaService from './Helena';

const helenaConfig = getConfig('helenaUsers');
const pmConfig = getConfig('tradingdb');


const pmEnvironment = `${pmConfig.protocol}://${pmConfig.host}:${
  pmConfig.port
}/api`;
const pmHttpService = new HttpService(pmEnvironment);


const helenaEnviroment = `${helenaConfig.protocol}://${helenaConfig.host}:${
  helenaConfig.port
}`;
const helenaHttpService = new HttpService(helenaEnviroment);


export let pmService // = new PMService(pmHttpService);
export let helenaService // = new HelenaService(helenaHttpService);
export let web3Service // = new Web3Service();

export const initServices = async ({ web3 }) => {
  helenaService = new HelenaService(helenaHttpService);
  pmService = new PMService(pmHttpService);
  web3Service = new Web3Service(web3);
}