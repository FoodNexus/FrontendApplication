# Create (or refresh password + role for) a second Keycloak recycler account for local mini-game tests.
# Requires: container foodnexus-keycloak running; master admin admin/admin; realm "foodnexus" with realm role RECYCLER.
#
# After this, log in as recycler1 / recycler1. Ensure ms_gestionUser provisions a profile on first login / API (same as your primary recycler).
#
# Usage:
#   .\scripts\keycloak-create-recycler-test-user.ps1
#   .\scripts\keycloak-create-recycler-test-user.ps1 -Username "recycler1" -Password "recycler1"

param(
  [string]$Username = "recycler1",
  [string]$Password = "recycler1",
  [string]$Realm = "foodnexus",
  [string]$RoleName = "RECYCLER",
  [string]$Container = "foodnexus-keycloak"
)

$inner = "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin >/dev/null 2>&1 && " +
  "(/opt/keycloak/bin/kcadm.sh create users -r $Realm -s username=$Username -s enabled=true 2>/dev/null || true) && " +
  "/opt/keycloak/bin/kcadm.sh set-password -r $Realm --username $Username --new-password $Password && " +
  "/opt/keycloak/bin/kcadm.sh add-roles -r $Realm --uusername $Username --rolename $RoleName"

docker exec $Container sh -c $inner
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "OK: user '$Username' in realm '$Realm' (password reset, role '$RoleName' assigned if it exists in the realm)."
