import getConfig from "../config";

const CONFIG = getConfig();

export function gasPrice() {
  return fetch('https://ethgasstation.info/json/ethgasAPI.json', {
    mode: 'cors',
    method: 'get',
  })
    .then(r => r.json())
    .then((response)=>{
      if(response.average > 0 && response.average < 200){
        const avg = response.average + (response.average*CONFIG.ROOTCHAIN.GAS.BOOST_BY)
        return Math.round(avg * 100) / 1000;
      }

      return Promise.reject('Average out of range (0–200)');
    });
}
