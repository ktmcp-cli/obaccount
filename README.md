# Open Banking UK Account and Transaction API CLI

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

A production-ready command-line interface for the Open Banking UK Account and Transaction API. Access accounts, balances, transactions, beneficiaries, direct debits, standing orders, and statements directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by Open Banking UK.

## Features

- **Accounts** — List and view account details
- **Balances** — Check account balances
- **Transactions** — View transaction history with date filters
- **Beneficiaries** — Manage beneficiaries
- **Direct Debits** — View direct debit mandates
- **Standing Orders** — List standing orders
- **Statements** — Access account statements
- **JSON output** — All commands support `--json` for scripting

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/openbankingorgukacco
```

## Authentication Setup

This API requires OAuth2 authentication. Configure your access token:

```bash
openbankingorgukacco config set --token YOUR_ACCESS_TOKEN
```

Optional: Set token expiry timestamp:

```bash
openbankingorgukacco config set --expiry 1234567890000
```

## Commands

### Configuration

```bash
# Set access token
openbankingorgukacco config set --token <token>

# Show current config
openbankingorgukacco config show

# Clear config
openbankingorgukacco config clear
```

### Accounts

```bash
# List all accounts
openbankingorgukacco accounts list

# Get account details
openbankingorgukacco accounts get <account-id>

# Get account balances
openbankingorgukacco accounts balances <account-id>

# Get account transactions
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
# List all transactions
openbankingorgukacco transactions list
openbankingorgukacco transactions list --from 2024-01-01 --to 2024-12-31

# Get transaction details
openbankingorgukacco transactions get <account-id> <transaction-id>
```

### Beneficiaries

```bash
# List all beneficiaries
openbankingorgukacco beneficiaries list

# List beneficiaries for account
openbankingorgukacco beneficiaries account <account-id>
```

### Direct Debits

```bash
# List all direct debits
openbankingorgukacco direct-debits list

# List direct debits for account
openbankingorgukacco direct-debits account <account-id>
```

### Standing Orders

```bash
# List all standing orders
openbankingorgukacco standing-orders list

# List standing orders for account
openbankingorgukacco standing-orders account <account-id>
```

### Statements

```bash
# List statements
openbankingorgukacco statements list <account-id>

# Get statement details
openbankingorgukacco statements get <account-id> <statement-id>

# Get statement transactions
openbankingorgukacco statements transactions <account-id> <statement-id>
```

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# List accounts as JSON
openbankingorgukacco accounts list --json

# Pipe to jq for filtering
openbankingorgukacco transactions list --json | jq '.[] | select(.Amount.Amount > 100)'

# Get account balances
openbankingorgukacco accounts balances <account-id> --json
```

## Examples

### View account balances

```bash
# List accounts
ACCOUNT_ID=$(openbankingorgukacco accounts list --json | jq -r '.[0].AccountId')

# Check balances
openbankingorgukacco accounts balances $ACCOUNT_ID --json
```

### Analyze transactions

```bash
# Get recent transactions
openbankingorgukacco transactions list --from 2024-01-01 --json

# Find large transactions
openbankingorgukacco transactions list --json | jq '.[] | select(.Amount.Amount > 1000)'
```

### Export statement data

```bash
# List statements
openbankingorgukacco statements list <account-id> --json

# Get statement transactions
openbankingorgukacco statements transactions <account-id> <statement-id> --json > statement.json
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/openbankingorgukacco](https://github.com/ktmcp-cli/openbankingorgukacco).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
