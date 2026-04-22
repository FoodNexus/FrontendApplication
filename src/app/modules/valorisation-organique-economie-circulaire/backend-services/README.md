# Backend submodules

See repo root `docker-compose.yml` for MySQL + Keycloak.

For local dev, run **`ms_gestionUser`** on **8087** (`.\mvnw.cmd spring-boot:run` in `ms_gestionUser`). The Angular `AuthService` targets `http://localhost:8087/api/users` unless you use Eureka + Gateway (**8089**).
