import Conf from 'conf';

const config = new Conf({
  projectName: 'openbankingorgukacco-cli',
  schema: {
    accessToken: {
      type: 'string',
      default: ''
    },
    tokenExpiry: {
      type: 'number',
      default: 0
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  const accessToken = config.get('accessToken');
  return !!accessToken;
}

export function hasValidToken() {
  const accessToken = config.get('accessToken');
  const tokenExpiry = config.get('tokenExpiry');
  if (!accessToken) return false;
  return tokenExpiry > Date.now() + 60000;
}

export default config;
