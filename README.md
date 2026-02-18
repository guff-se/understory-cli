# Understory CLI

Command-line interface for the [Understory](https://understory.io) ticket service. Optimized for AI agent use with structured JSON output, explicit subcommands, and comprehensive help.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   npm run build
   ```

2. **Configure credentials**
   ```bash
   cp .env.example .env
   # Edit .env with your UNDERSTORY_CLIENT_ID and UNDERSTORY_SECRET_KEY
   ```
   Get credentials from [Understory Backoffice](https://backoffice.understory.io) > Company settings > Integrations.

3. **Install globally** (makes the `understory` command available)
   ```bash
   npm link
   ```

4. **Verify**
   ```bash
   understory me
   ```

## Usage

```bash
# Verify API connectivity
understory me

# List experiences
understory experiences list --limit 10

# Get a single experience
understory experiences get <experienceId>

# List events (optionally filter by date range)
understory events list --from 2025-01-01

# List bookings
understory bookings list
```

See [AGENTS.md](AGENTS.md) for a full command reference and agent-focused documentation.

## Global Options

- `-f, --format <json|table>` – Output format (default: json)
- `--no-color` – Disable colored output

## Installation (global)

```bash
npm link
understory me
```

## Development

```bash
npm run build
npm test
npm run test:unit      # Unit tests only
npm run test:integration   # Integration tests (requires .env)
```

## License

Apache-2.0
