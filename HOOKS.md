# Git Hooks Documentation

This repository uses Git hooks to prevent committing sensitive data.

## Pre-commit Hook

Automatically runs before every commit to check for:

### 🔐 Security Checks
- ❌ **Private keys** (0x followed by 64 hex characters)
- ❌ **API keys** (CoinGecko format: CG-...)
- ❌ **AWS credentials** (AWS_SECRET, aws_secret_access_key)
- ❌ **.env files** (should be in .gitignore)
- ❌ **.pem files** (SSH/SSL private keys)

### 🧹 Quality Checks
- ⚠️  **Previous-project references** (prevents cross-project contamination)
- ⚠️  **Large files** (warns if >5MB)
- ⚠️  **Generic API key patterns** (prompts for confirmation)

### Example Output

```bash
🔍 Running pre-commit security checks...
✅ Pre-commit checks passed!
```

If a secret is detected:
```bash
❌ BLOCKED: Private key detected in staged files!
Never commit private keys. Use environment variables instead.
```

## Commit Message Template

The `prepare-commit-msg` hook provides a template:

```
<type>: <subject>

Types: feat, fix, docs, style, refactor, test, chore
Example: feat: add agent bid validation
```

## Installation

Hooks are automatically installed when you clone this repo. To reinstall:

```bash
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Bypassing Hooks (Emergency Only)

If you **absolutely must** bypass the hooks (not recommended):

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning:** Only use in emergencies. You may expose secrets!

## Best Practices

### ✅ DO:
- Use environment variables for secrets
- Store API keys in `.env` (gitignored)
- Use `process.env.VARIABLE_NAME` in code
- Review changes before committing: `git diff --cached`

### ❌ DON'T:
- Hardcode private keys
- Commit `.env` files
- Use `--no-verify` unless absolutely necessary
- Store passwords in code

## Environment Variables

Required for running the project:

```bash
# Create .env file (never commit this!)
COINGECKO_API_KEY=your_key_here
PRIVATE_KEY=0x...your_wallet_key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

Then load before running:
```bash
export $(cat .env | xargs)
node agents/run-live-auction.js
```

## Rotating Compromised Secrets

If a secret was committed:

1. **Immediately revoke** the old key/token
2. **Generate a new** key/token
3. **Update** your `.env` file
4. **Delete the repo** and re-push from clean history
5. **Never reuse** the compromised secret

## Questions?

Contact: hello@empowertours.com
