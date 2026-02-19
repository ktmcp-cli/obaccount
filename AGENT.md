# AGENT.md — Open Banking UK Account and Transaction API CLI for AI Agents

This document explains how to use the Open Banking UK Account and Transaction API CLI as an AI agent.

## Overview

The `openbankingorgukacco` CLI provides access to account and transaction data via the Open Banking UK AISP API. Use it to view accounts, balances, transactions, beneficiaries, direct debits, standing orders, and statements.

## Prerequisites

The CLI requires an OAuth2 access token:

```bash
openbankingorgukacco config set --token <token>
openbankingorgukacco config set --expiry <timestamp>
```

## All Commands

### Config

```bash
openbankingorgukacco config set --token <token>
openbankingorgukacco config set --expiry <timestamp>
openbankingorgukacco config show
openbankingorgukacco config clear
```

### Accounts

```bash
# List accounts
openbankingorgukacco accounts list

# Get account
openbankingorgukacco accounts get <account-id>

# Get balances
openbankingorgukacco accounts balances <account-id>

# Get transactions
openbankingorgukacco accounts transactions <account-id>
openbankingorgukacco accounts transactions <account-id> --from 2024-01-01 --to 2024-12-31
```

### Balances

```bash
# List all balances
openbankingorgukacco balances list
```

### Transactions

```bash
# List transactions
openbankingorgukacco transactions list
openbankingorgukacco transactions list --from 2024-01-01 --to 2024-12-31

# Get transaction
openbankingorgukacco transactions get <account-id> <transaction-id>
```

### Beneficiaries

```bash
# List beneficiaries
openbankingorgukacco beneficiaries list

# List for account
openbankingorgukacco beneficiaries account <account-id>
```

### Direct Debits

```bash
# List direct debits
openbankingorgukacco direct-debits list

# List for account
openbankingorgukacco direct-debits account <account-id>
```

### Standing Orders

```bash
# List standing orders
openbankingorgukacco standing-orders list

# List for account
openbankingorgukacco standing-orders account <account-id>
```

### Statements

```bash
# List statements
openbankingorgukacco statements list <account-id>

# Get statement
openbankingorgukacco statements get <account-id> <statement-id>

# Get statement transactions
openbankingorgukacco statements transactions <account-id> <statement-id>
```

## JSON Output

All commands support `--json` for structured output. Always use `--json` when parsing results programmatically:

```bash
openbankingorgukacco accounts list --json
openbankingorgukacco transactions list --json
openbankingorgukacco balances list --json
```

## Example Workflows

### Get account overview

```bash
# List accounts
ACCOUNTS=$(openbankingorgukacco accounts list --json)

# Get first account ID
ACCOUNT_ID=$(echo $ACCOUNTS | jq -r '.[0].AccountId')

# Get balances
openbankingorgukacco accounts balances $ACCOUNT_ID --json
```

### Analyze spending

```bash
# Get transactions for date range
openbankingorgukacco transactions list --from 2024-01-01 --to 2024-01-31 --json

# Filter debits
openbankingorgukacco transactions list --from 2024-01-01 --json | jq '.[] | select(.CreditDebitIndicator == "Debit")'
```

### Export data

```bash
# Get all transactions and save
openbankingorgukacco transactions list --json > transactions.json

# Get statement transactions
openbankingorgukacco statements transactions <account-id> <statement-id> --json > statement.json
```

## Tips for Agents

1. Always use `--json` when you need to extract specific fields
2. Access token is required for all commands
3. Date filters use ISO 8601 format (YYYY-MM-DD)
4. Transaction amounts include Amount and Currency fields
5. CreditDebitIndicator shows "Credit" or "Debit"
6. Account IDs are required for account-specific operations
