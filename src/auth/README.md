# Browser authentication entry

Included by `npx @samline/astro add auth`. Configure the server integration and
activate its route before connecting browser controls.

`client.ts` exports the vanilla Better Auth client for database/OAuth modes and
explicit REST-mode sign-in, refresh, sign-out and session functions. No client
code is loaded automatically. Read the configuration, security and lifecycle
contract in [server/auth](../server/auth/README.md) before wiring a section.
