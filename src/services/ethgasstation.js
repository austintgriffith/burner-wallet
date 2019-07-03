// @format
import getConfig from "../config";

const CONFIG = getConfig();
const API = "https://ethgasstation.info/json/ethgasAPI.json";

function get() {
  return fetch(API, {
    mode: "cors",
    method: "get"
  }).then(r => r.json());
}

// NOTE: Both price() and time() currently default to average. In the future,
// these function could be adjusted to feature "fast" and "safe" too.
// NOTE2: Both functions can throw and should be try-catch'ed.
export async function price() {
  const { average } = await get();
  if (average > 0 && average < 200) {
    const avg = average + average * CONFIG.ROOTCHAIN.GAS.BOOST_BY;
    return Math.round(avg * 100) / 1000;
  }
  return Promise.reject("Average out of range (0–200)");
}

export async function time() {
  // NOTE: avgWait is returned from ethgasstation in minutes (double)
  const { avgWait } = await get();
  // We convert minutes to milliseconds
  return avgWait * 60 * 1000;
}
