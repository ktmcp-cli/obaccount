import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured, clearConfig } from './config.js';
import {
  listAccounts,
  getAccount,
  getAccountBalances,
  getAccountTransactions,
  listBalances,
  listTransactions,
  getTransaction,
  listBeneficiaries,
  getAccountBeneficiaries,
  listDirectDebits,
  getAccountDirectDebits,
  listStandingOrders,
  getAccountStandingOrders,
  listStatements,
  getStatement,
  getStatementTransactions
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Access token not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  openbankingorgukacco config set --token <token>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('openbankingorgukacco')
  .description(chalk.bold('Open Banking UK Account & Transaction CLI') + ' - Access account and transaction data')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--token <token>', 'Access token')
  .option('--expiry <timestamp>', 'Token expiry timestamp')
  .action((options) => {
    if (options.token) {
      setConfig('accessToken', options.token);
      printSuccess(`Access token set`);
    }
    if (options.expiry) {
      setConfig('tokenExpiry', parseInt(options.expiry));
      printSuccess(`Token expiry set`);
    }
    if (!options.token && !options.expiry) {
      printError('No options provided. Use --token or --expiry');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const hasToken = !!getConfig('accessToken');
    const tokenExpiry = getConfig('tokenExpiry');

    console.log(chalk.bold('\nOpen Banking UK Account & Transaction CLI Configuration\n'));
    console.log('Access Token: ', hasToken ? chalk.green('set') : chalk.red('not set'));
    if (tokenExpiry) {
      const expiry = new Date(tokenExpiry);
      const isValid = tokenExpiry > Date.now();
      console.log('Token Expiry: ', isValid ? chalk.green(expiry.toLocaleString()) : chalk.red(`expired (${expiry.toLocaleString()})`));
    }
    console.log('');
  });

configCmd
  .command('clear')
  .description('Clear configuration')
  .action(() => {
    clearConfig();
    printSuccess('Configuration cleared');
  });

// ============================================================
// ACCOUNTS
// ============================================================

const accountsCmd = program.command('accounts').description('Manage accounts');

accountsCmd
  .command('list')
  .description('List all accounts')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const accounts = await withSpinner('Fetching accounts...', () => listAccounts());

      if (options.json) {
        printJson(accounts);
        return;
      }

      printTable(accounts, [
        { key: 'AccountId', label: 'ID' },
        { key: 'Nickname', label: 'Nickname' },
        { key: 'Currency', label: 'Currency' },
        { key: 'AccountType', label: 'Type' },
        { key: 'AccountSubType', label: 'SubType' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('get <account-id>')
  .description('Get account details')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const account = await withSpinner('Fetching account...', () => getAccount(accountId));

      if (options.json) {
        printJson(account);
        return;
      }

      console.log(chalk.bold('\nAccount Details\n'));
      console.log('Account ID:  ', chalk.cyan(account.AccountId || accountId));
      console.log('Nickname:    ', account.Nickname || 'N/A');
      console.log('Currency:    ', account.Currency || 'N/A');
      console.log('Type:        ', account.AccountType || 'N/A');
      console.log('SubType:     ', account.AccountSubType || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('balances <account-id>')
  .description('Get account balances')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const balances = await withSpinner('Fetching balances...', () => getAccountBalances(accountId));

      if (options.json) {
        printJson(balances);
        return;
      }

      printTable(balances, [
        { key: 'Type', label: 'Type' },
        { key: 'Amount', label: 'Amount', format: (v, row) => `${v?.Amount || '0.00'} ${v?.Currency || ''}` },
        { key: 'CreditDebitIndicator', label: 'Indicator' },
        { key: 'DateTime', label: 'Date Time' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('transactions <account-id>')
  .description('Get account transactions')
  .option('--from <date>', 'From date (ISO 8601)')
  .option('--to <date>', 'To date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const transactions = await withSpinner('Fetching transactions...', () =>
        getAccountTransactions(accountId, {
          fromDate: options.from,
          toDate: options.to
        })
      );

      if (options.json) {
        printJson(transactions);
        return;
      }

      printTable(transactions, [
        { key: 'TransactionId', label: 'ID', format: (v) => v?.substring(0, 10) + '...' },
        { key: 'BookingDateTime', label: 'Date', format: (v) => v?.substring(0, 10) || '' },
        { key: 'Amount', label: 'Amount', format: (v, row) => `${v?.Amount || '0.00'} ${v?.Currency || ''}` },
        { key: 'CreditDebitIndicator', label: 'Type' },
        { key: 'Status', label: 'Status' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// BALANCES
// ============================================================

const balancesCmd = program.command('balances').description('View balances');

balancesCmd
  .command('list')
  .description('List all balances')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const balances = await withSpinner('Fetching balances...', () => listBalances());

      if (options.json) {
        printJson(balances);
        return;
      }

      printTable(balances, [
        { key: 'AccountId', label: 'Account ID' },
        { key: 'Type', label: 'Type' },
        { key: 'Amount', label: 'Amount', format: (v, row) => `${v?.Amount || '0.00'} ${v?.Currency || ''}` },
        { key: 'CreditDebitIndicator', label: 'Indicator' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// TRANSACTIONS
// ============================================================

const transactionsCmd = program.command('transactions').description('View transactions');

transactionsCmd
  .command('list')
  .description('List all transactions')
  .option('--from <date>', 'From date (ISO 8601)')
  .option('--to <date>', 'To date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const transactions = await withSpinner('Fetching transactions...', () =>
        listTransactions({
          fromDate: options.from,
          toDate: options.to
        })
      );

      if (options.json) {
        printJson(transactions);
        return;
      }

      printTable(transactions, [
        { key: 'AccountId', label: 'Account' },
        { key: 'TransactionId', label: 'ID', format: (v) => v?.substring(0, 10) + '...' },
        { key: 'BookingDateTime', label: 'Date', format: (v) => v?.substring(0, 10) || '' },
        { key: 'Amount', label: 'Amount', format: (v, row) => `${v?.Amount || '0.00'} ${v?.Currency || ''}` },
        { key: 'CreditDebitIndicator', label: 'Type' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

transactionsCmd
  .command('get <account-id> <transaction-id>')
  .description('Get transaction details')
  .option('--json', 'Output as JSON')
  .action(async (accountId, transactionId, options) => {
    requireAuth();
    try {
      const transaction = await withSpinner('Fetching transaction...', () =>
        getTransaction(accountId, transactionId)
      );

      if (options.json) {
        printJson(transaction);
        return;
      }

      console.log(chalk.bold('\nTransaction Details\n'));
      console.log('Transaction ID:  ', chalk.cyan(transaction.TransactionId || transactionId));
      console.log('Account ID:      ', transaction.AccountId || accountId);
      console.log('Amount:          ', `${transaction.Amount?.Amount || '0.00'} ${transaction.Amount?.Currency || ''}`);
      console.log('Type:            ', transaction.CreditDebitIndicator || 'N/A');
      console.log('Status:          ', transaction.Status || 'N/A');
      console.log('Booking Date:    ', transaction.BookingDateTime || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// BENEFICIARIES
// ============================================================

const beneficiariesCmd = program.command('beneficiaries').description('View beneficiaries');

beneficiariesCmd
  .command('list')
  .description('List all beneficiaries')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const beneficiaries = await withSpinner('Fetching beneficiaries...', () => listBeneficiaries());

      if (options.json) {
        printJson(beneficiaries);
        return;
      }

      printTable(beneficiaries, [
        { key: 'AccountId', label: 'Account' },
        { key: 'BeneficiaryId', label: 'ID' },
        { key: 'Reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

beneficiariesCmd
  .command('account <account-id>')
  .description('List beneficiaries for account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const beneficiaries = await withSpinner('Fetching beneficiaries...', () =>
        getAccountBeneficiaries(accountId)
      );

      if (options.json) {
        printJson(beneficiaries);
        return;
      }

      printTable(beneficiaries, [
        { key: 'BeneficiaryId', label: 'ID' },
        { key: 'Reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// DIRECT DEBITS
// ============================================================

const directDebitsCmd = program.command('direct-debits').description('View direct debits');

directDebitsCmd
  .command('list')
  .description('List all direct debits')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const directDebits = await withSpinner('Fetching direct debits...', () => listDirectDebits());

      if (options.json) {
        printJson(directDebits);
        return;
      }

      printTable(directDebits, [
        { key: 'AccountId', label: 'Account' },
        { key: 'DirectDebitId', label: 'ID' },
        { key: 'MandateIdentification', label: 'Mandate' },
        { key: 'DirectDebitStatusCode', label: 'Status' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

directDebitsCmd
  .command('account <account-id>')
  .description('List direct debits for account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const directDebits = await withSpinner('Fetching direct debits...', () =>
        getAccountDirectDebits(accountId)
      );

      if (options.json) {
        printJson(directDebits);
        return;
      }

      printTable(directDebits, [
        { key: 'DirectDebitId', label: 'ID' },
        { key: 'MandateIdentification', label: 'Mandate' },
        { key: 'DirectDebitStatusCode', label: 'Status' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// STANDING ORDERS
// ============================================================

const standingOrdersCmd = program.command('standing-orders').description('View standing orders');

standingOrdersCmd
  .command('list')
  .description('List all standing orders')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const standingOrders = await withSpinner('Fetching standing orders...', () => listStandingOrders());

      if (options.json) {
        printJson(standingOrders);
        return;
      }

      printTable(standingOrders, [
        { key: 'AccountId', label: 'Account' },
        { key: 'StandingOrderId', label: 'ID' },
        { key: 'Frequency', label: 'Frequency' },
        { key: 'Reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

standingOrdersCmd
  .command('account <account-id>')
  .description('List standing orders for account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const standingOrders = await withSpinner('Fetching standing orders...', () =>
        getAccountStandingOrders(accountId)
      );

      if (options.json) {
        printJson(standingOrders);
        return;
      }

      printTable(standingOrders, [
        { key: 'StandingOrderId', label: 'ID' },
        { key: 'Frequency', label: 'Frequency' },
        { key: 'Reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// STATEMENTS
// ============================================================

const statementsCmd = program.command('statements').description('View statements');

statementsCmd
  .command('list <account-id>')
  .description('List statements for account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const statements = await withSpinner('Fetching statements...', () => listStatements(accountId));

      if (options.json) {
        printJson(statements);
        return;
      }

      printTable(statements, [
        { key: 'StatementId', label: 'ID' },
        { key: 'Type', label: 'Type' },
        { key: 'StartDateTime', label: 'Start', format: (v) => v?.substring(0, 10) || '' },
        { key: 'EndDateTime', label: 'End', format: (v) => v?.substring(0, 10) || '' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

statementsCmd
  .command('get <account-id> <statement-id>')
  .description('Get statement details')
  .option('--json', 'Output as JSON')
  .action(async (accountId, statementId, options) => {
    requireAuth();
    try {
      const statement = await withSpinner('Fetching statement...', () =>
        getStatement(accountId, statementId)
      );

      if (options.json) {
        printJson(statement);
        return;
      }

      console.log(chalk.bold('\nStatement Details\n'));
      console.log('Statement ID: ', chalk.cyan(statement.StatementId || statementId));
      console.log('Type:         ', statement.Type || 'N/A');
      console.log('Start Date:   ', statement.StartDateTime || 'N/A');
      console.log('End Date:     ', statement.EndDateTime || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

statementsCmd
  .command('transactions <account-id> <statement-id>')
  .description('Get statement transactions')
  .option('--json', 'Output as JSON')
  .action(async (accountId, statementId, options) => {
    requireAuth();
    try {
      const transactions = await withSpinner('Fetching transactions...', () =>
        getStatementTransactions(accountId, statementId)
      );

      if (options.json) {
        printJson(transactions);
        return;
      }

      printTable(transactions, [
        { key: 'TransactionId', label: 'ID', format: (v) => v?.substring(0, 10) + '...' },
        { key: 'BookingDateTime', label: 'Date', format: (v) => v?.substring(0, 10) || '' },
        { key: 'Amount', label: 'Amount', format: (v, row) => `${v?.Amount || '0.00'} ${v?.Currency || ''}` },
        { key: 'CreditDebitIndicator', label: 'Type' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
