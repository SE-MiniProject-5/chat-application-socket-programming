# SR-08 / SEC-REQ-08 — TLS beyond localhost

## Requirement

When the chat application is deployed on any network other than localhost, all client-server traffic must use TLS (HTTPS and WSS).

## Implementation

The application now selects its transport from the `HOST` environment variable:

- `HOST=localhost`, `HOST=127.0.0.1`, or `HOST=::1` → HTTP is allowed for local demonstrations.
- Any other host, such as `0.0.0.0`, a LAN address, or a public hostname → TLS is mandatory.

For non-localhost deployments the server requires:

- `TLS_KEY_PATH` — path to the private TLS key.
- `TLS_CERT_PATH` — path to the TLS certificate.

If these variables are missing or the files do not exist, the server fails fast instead of starting an insecure HTTP listener.

## WebSocket behavior

The browser already chooses the WebSocket protocol from the page protocol:

- HTTPS page → `wss://`
- HTTP localhost page → `ws://`

Therefore, once the application is deployed through HTTPS, the WebSocket connection is automatically upgraded to WSS.

## Example deployment

Generate/provide a certificate and private key from a trusted certificate authority, then start the application with:

```bash
HOST=0.0.0.0 \
TLS_KEY_PATH=/etc/chat-app/tls/server.key \
TLS_CERT_PATH=/etc/chat-app/tls/server.crt \
npm start
```

For a public hostname, the certificate should contain that hostname in its Subject Alternative Name (SAN). For a production deployment, use a certificate issued by a trusted CA rather than a self-signed certificate.

## Local development

No TLS setup is required for the normal localhost demonstration:

```bash
npm start
```

The default bind target is `127.0.0.1`, so the server uses HTTP locally.

## Security behavior

This implementation intentionally fails closed for non-localhost deployments. A developer cannot accidentally expose the application over plaintext HTTP merely by changing the bind host to a network interface.
