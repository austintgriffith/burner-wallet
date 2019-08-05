import axios from 'axios';

export default class HttpService {
  constructor(envService) {
    this.axios = axios;
    this.envService = envService;
  }

  post(uri, data, options) {
    return this.raw(uri, 'post', data);
  }

  get(uri, options = {}) {
    return this.raw(uri, 'get', {}, options.params);
  }

  raw(uri, method, data, options = {}, params) {
    const url = `${this.envService}${uri}`;
    return this.axios({
      url,
      method,
      headers: options.headers,
      data,
      params
    })
      .then((response) => response.data)
      .catch(this.handleFailedRequest);
  }
}
