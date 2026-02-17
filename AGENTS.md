# Understory CLI – Agent Guide

CLI for the Understory ticket service. Optimized for AI agents: structured JSON output, explicit subcommands, predictable syntax.

## Quick Start

1. Set credentials in `.env`:
   - `UNDERSTORY_CLIENT_ID`
   - `UNDERSTORY_SECRET_KEY`

2. Verify connectivity:
   ```bash
   understory me
   ```

3. Use `--format json` (default) for machine-readable output.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UNDERSTORY_CLIENT_ID` | Yes | From Understory Backoffice > Integrations |
| `UNDERSTORY_SECRET_KEY` | Yes | Secret key (shown once at creation) |
| `UNDERSTORY_SCOPES` | No | OAuth2 scopes. Default: `openid experience.read event.read booking.read marketing.read`. Add `order.read` for Orders API. |

## Commands Reference

All commands support `--format json` (default) and `--format table`. Use `--no-color` for non-TTY or CI.

### Verify Auth
```bash
understory me
```
Returns `company_id`, `user_id`, `email`. Use to confirm API connectivity.

### Experiences (ticketable products)
```bash
understory experiences list [--cursor <cursor>] [--limit <n>]
understory experiences get <experienceId>
```

### Events (scheduled instances)
```bash
understory events list [--from <datetime>] [--to <datetime>] [--cursor] [--limit]
understory events get <eventId>
```
Use ISO 8601 for `--from` / `--to` (e.g. `2025-01-15T09:00:00`).

### Event Availability
```bash
understory availability event <eventId>
understory availability list --experience-id <id> [--from] [--to] [--cursor] [--limit]
```

### Bookings
```bash
understory bookings list [--from] [--to] [--limit] [--sort +/-created_at]
understory bookings get <bookingId>
understory bookings tickets <bookingId>
```

### Orders (requires `order.read` scope)
```bash
understory orders list [--from] [--to] [--limit]
understory orders get <orderId>
understory orders line-items <orderId>
understory orders transactions <orderId>
understory orders refunds <orderId>
```

### Marketing Consents (Grow)
```bash
understory marketing list [--cursor] [--limit]
```

## Output Format

- **JSON (default)**: Pretty-printed JSON. Paginated responses include `items` array and `next` cursor.
- **Table**: Human-readable table for list commands. Use `--format table`.

## Pagination

List endpoints return:
```json
{ "next": "<cursor>", "items": [...] }
```
- Use `next` as `--cursor` for the next page
- Omit or empty cursor = first page
- `--limit` controls page size (defaults vary by endpoint)

## Error Handling

- **Exit 0**: Success
- **Exit 1**: Auth/validation or client error (4xx)
- **Exit 2**: Server error (5xx)

Errors are written to stderr. JSON format: `{"error":"<message>"}`. API errors may include `body` with details.

## Help

```bash
understory --help
understory experiences --help
understory experiences list --help
```

## API Reference

Base URL: `https://api.understory.io`  
Documentation: https://developer.understory.io/apis
