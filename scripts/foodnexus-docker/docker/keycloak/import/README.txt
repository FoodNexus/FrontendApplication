Place your Keycloak realm export here as: foodnexus-realm.json

If import fails on newer Keycloak fields, remove from the JSON:
- verifiableCredentialsEnabled, organizationsEnabled, adminPermissionsEnabled, keycloakVersion

Or import manually via Admin Console (realm foodnexus -> Import).
