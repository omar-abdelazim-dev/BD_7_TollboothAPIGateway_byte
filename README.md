# Tollbooth API Gateway

An authenticated reverse-proxy gateway for B.Y.T.E AVIP 2026 Backend Task 7. It intercepts all client traffic, validates a server-held API key, routes allowed traffic to three simulated internal microservices, and writes an append-only JSONL audit log.

```text
Client -> Tollbooth :4000 --API key--> /auth    -> Auth service :4101
                                  |-> /users   -> Users service :4102
                                  +-> /billing -> Billing service :4103
                                        |
                                        +-> logs/gateway.jsonl
```

## Features

- Central API-key authentication before any proxying
- Fixed route table, so clients cannot select arbitrary upstream hosts
- Reverse proxy to auth, users, and billing services
- Removes the gateway credential before forwarding upstream
- Logs timestamp, client IP, HTTP method, path, and target route for every request, including denied requests
- Explicit `401`, `404`, and `502` error responses
- Integration test with live ephemeral microservice servers

## Run

Requirements: Node.js 22.5+.

```bash
npm install
API_KEY='a-long-random-development-key' npm start
```

This starts the gateway on port `4000` and the internal services on `4101`-`4103`. Run tests with `npm test`.

## Vercel demo

The public Vercel demo exposes the same API-key-protected routes under `/api` (for example, `/api/users`). Vercel serverless functions cannot keep the three internal processes alive, so the demo mounts the simulated services inside a serverless adapter. The repository's `src/server.js` remains the full local reverse-proxy implementation with independently running services and append-only log file.

## Examples

Unauthorized traffic is denied:

```bash
curl -i http://localhost:4000/users
```

```json
{ "error": "INVALID_API_KEY", "message": "A valid X-API-Key is required." }
```

Route an authorized users request:

```bash
curl http://localhost:4000/users -H 'X-API-Key: a-long-random-development-key'
```

```json
{ "service": "users", "data": [{ "id": "u_1", "name": "Ada Lovelace" }] }
```

Route a login request:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H 'X-API-Key: a-long-random-development-key' \
  -H 'Content-Type: application/json' \
  -d '{"email":"operator@example.com","password":"not-used-by-demo"}'
```

Route billing:

```bash
curl http://localhost:4000/billing/invoices -H 'X-API-Key: a-long-random-development-key'
```

Example `logs/gateway.jsonl` entry:

```json
{"timestamp":"2026-09-08T18:00:00.000Z","clientIp":"::ffff:127.0.0.1","method":"GET","targetRoute":"users","path":"/users"}
```

## Security and production notes

Use a high-entropy key from a secret manager and TLS in production. The key comparison avoids an early-exit string comparison. Internal services should be private-network-only; do not publish their ports. For a distributed deployment, write audit logs to a centralized immutable log sink and replace the static API key with short-lived JWT or mTLS authentication.

## License

MIT
