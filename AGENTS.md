# Understory CLI – Agent Guide

CLI for the Understory ticket service. Optimized for AI agents: structured JSON output, explicit subcommands, predictable syntax.

## Common Questions → Commands

| Question | Command |
|----------|---------|
| How many guests today/tomorrow? | `understory stats guests --period today` or `--period tomorrow` |
| How many guests this week / next week? | `understory stats guests --period this-week` or `--period next-week` |
| How many guests this weekend / next weekend? | `understory stats guests --period this-weekend` or `--period next-weekend` |
| How many guests last month? | `understory stats guests --period last-month` |
| How many visitors in [month]? | `understory stats guests --month 2026-02` |
| How many booking transactions next week? | `understory stats bookings --period next-week` (slower) |
| List bookings for [date] | `understory bookings for-date 2026-02-18` |
| When is our next event today? | `understory events next` |
| Busiest time slot today? | `understory stats busiest --period today` |
| Do we have space for walk-ins? Which slots available? | `understory availability day` or `--available-only` |
| Which slots available next week? | `understory availability day --period next-week --available-only` |
| Remaining spots for an event? | `understory availability event <eventId>` |
| Get tickets for a booking | `understory bookings tickets <bookingId>` |
| Status of a booking | `understory bookings get <bookingId>` |

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
understory events next [--limit <n>] [--hours <n>]
understory events get <eventId>
```
- **events next**: Next upcoming events from now. Use for "when is our next event today?". Default: 5 events, 24h lookahead.
- Use ISO 8601 for `--from` / `--to`. The CLI accepts any valid ISO 8601 (e.g. `2025-01-15T09:00:00`, `2026-02-21T00:00:00Z`, or `2026-02-21T00:00:00+01:00`) and normalizes to UTC for the API.

### Event Availability
```bash
understory availability event <eventId>
understory availability day [--date YYYY-MM-DD] [--period tomorrow|next-week] [--available-only]
understory availability list --experience-id <id> [--from] [--to] [--cursor] [--limit]
```
- **availability day**: Events for a day (or week) with available capacity. Use for "do we have space for walk-ins?" or "which slots available next week?". Default: today. Use `--available-only` to show only slots with space.

### Bookings
```bash
understory bookings list [--from] [--to] [--limit] [--sort +/-created_at]
understory bookings for-date <YYYY-MM-DD>
understory bookings get <bookingId>
understory bookings tickets <bookingId>
```
- **bookings for-date**: List bookings for events on a specific date (excludes CANCELLED). Slower with large datasets.

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

### Stats (aggregate metrics by date range)
Answer common questions without post-processing:

```bash
understory stats guests --period <today|tomorrow|this-week|next-week|this-month|last-month>
understory stats guests --month <YYYY-MM>
understory stats guests --from <datetime> --to <datetime>
understory stats bookings --period <today|tomorrow|this-week|next-week|this-month|last-month>
understory stats bookings --month <YYYY-MM>
understory stats bookings --from <datetime> --to <datetime>
understory stats busiest [--period today] [--month YYYY-MM] [--from] [--to]
```

- **stats guests**: Total guest count (reserved capacity) for events in the range. Fast. Use for "how many guests tomorrow?", "how many people last month?", "how many visitors in February 2026?".
- **stats bookings**: Count of booking transactions (excludes CANCELLED). Slower with large datasets.
- **stats busiest**: Event/time slot with most guests in the range. Use for "busiest time slot today".
- **--period**: `today` | `tomorrow` | `this-week` | `next-week` | `this-weekend` | `next-weekend` | `this-month` | `last-month`.
- **--month**: Specific month, e.g. `2026-02` for February 2026.
- **--from / --to**: Explicit ISO 8601 range (to is exclusive). Accept any valid ISO 8601 (with or without timezone); the CLI normalizes to UTC for the API.

Example output (stats guests):
```json
{ "guest_count": 11, "event_count": 8, "from": "...", "to": "..." }
```

Example output (stats busiest):
```json
{ "busiest": { "event_id": "...", "start_time": "2026-02-17T16:00:00Z", "guest_count": 6, "capacity_total": 30 }, "from": "...", "to": "..." }
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
