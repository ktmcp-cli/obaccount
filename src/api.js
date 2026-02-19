import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.openbanking.org.uk/open-banking/v3.1/aisp';

/**
 * Make an authenticated API request
 */
async function apiRequest(method, endpoint, data = null, params = null) {
  const accessToken = getConfig('accessToken');

  if (!accessToken) {
    throw new Error('Access token not configured. Run: openbankingorgukacco config set --token <token>');
  }

  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error('Authentication failed. Check your access token.');
    } else if (status === 403) {
      throw new Error('Access forbidden. Check your API permissions.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else {
      const message = data?.message || data?.error || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from Open Banking API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// ACCOUNTS
// ============================================================

export async function listAccounts() {
  const data = await apiRequest('GET', '/accounts');
  return data.Data?.Account || [];
}

export async function getAccount(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}`);
  return data.Data?.Account?.[0] || null;
}

export async function getAccountBalances(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/balances`);
  return data.Data?.Balance || [];
}

export async function getAccountTransactions(accountId, { fromDate, toDate } = {}) {
  const params = {};
  if (fromDate) params.fromBookingDateTime = fromDate;
  if (toDate) params.toBookingDateTime = toDate;

  const data = await apiRequest('GET', `/accounts/${accountId}/transactions`, null, params);
  return data.Data?.Transaction || [];
}

// ============================================================
// BALANCES
// ============================================================

export async function listBalances() {
  const data = await apiRequest('GET', '/balances');
  return data.Data?.Balance || [];
}

// ============================================================
// TRANSACTIONS
// ============================================================

export async function listTransactions({ fromDate, toDate } = {}) {
  const params = {};
  if (fromDate) params.fromBookingDateTime = fromDate;
  if (toDate) params.toBookingDateTime = toDate;

  const data = await apiRequest('GET', '/transactions', null, params);
  return data.Data?.Transaction || [];
}

export async function getTransaction(accountId, transactionId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/transactions/${transactionId}`);
  return data.Data?.Transaction?.[0] || null;
}

// ============================================================
// BENEFICIARIES
// ============================================================

export async function listBeneficiaries() {
  const data = await apiRequest('GET', '/beneficiaries');
  return data.Data?.Beneficiary || [];
}

export async function getAccountBeneficiaries(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/beneficiaries`);
  return data.Data?.Beneficiary || [];
}

// ============================================================
// DIRECT DEBITS
// ============================================================

export async function listDirectDebits() {
  const data = await apiRequest('GET', '/direct-debits');
  return data.Data?.DirectDebit || [];
}

export async function getAccountDirectDebits(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/direct-debits`);
  return data.Data?.DirectDebit || [];
}

// ============================================================
// STANDING ORDERS
// ============================================================

export async function listStandingOrders() {
  const data = await apiRequest('GET', '/standing-orders');
  return data.Data?.StandingOrder || [];
}

export async function getAccountStandingOrders(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/standing-orders`);
  return data.Data?.StandingOrder || [];
}

// ============================================================
// STATEMENTS
// ============================================================

export async function listStatements(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/statements`);
  return data.Data?.Statement || [];
}

export async function getStatement(accountId, statementId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/statements/${statementId}`);
  return data.Data?.Statement?.[0] || null;
}

export async function getStatementTransactions(accountId, statementId) {
  const data = await apiRequest('GET', `/accounts/${accountId}/statements/${statementId}/transactions`);
  return data.Data?.Transaction || [];
}
