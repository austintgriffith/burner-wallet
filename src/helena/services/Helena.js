import { getConfig } from '../utils/config';

class HelenaService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  signUp(user) {
    const instance = getConfig('instance');
    user.instance = instance.name;
    return this.httpService.post('/users', user);
  }
}

export default HelenaService;
