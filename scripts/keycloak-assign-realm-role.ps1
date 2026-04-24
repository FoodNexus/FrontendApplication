# Assign a realm role in Keycloak realm "foodnexus" (when Admin UI is awkward).
# Requires: container foodnexus-keycloak running; master admin admin/admin
#
# Usage:
#   .\scripts\keycloak-assign-realm-role.ps1 -Username "donateur" -RoleName "DONOR"

param(
    [Parameter(Mandatory = $true)][string]$Username,
    [Parameter(Mandatory = $true)][string]$RoleName,
    [string]$Container = "foodnexus-keycloak"
)

$inner = "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin >/dev/null 2>&1; /opt/keycloak/bin/kcadm.sh add-roles -r foodnexus --uusername $Username --rolename $RoleName"
docker exec $Container sh -c $inner
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "OK: assigned '$RoleName' to '$Username' in foodnexus."
