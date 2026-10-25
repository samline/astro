/** Shared by runtime configuration and the explicit database migration command. */
export const authUserFields = {
  roles: { type: 'string[]', input: false, defaultValue: [] },
  permissions: { type: 'string[]', input: false, defaultValue: [] }
}
