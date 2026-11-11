# Student Management System

End-to-end app: **Expo React Native** client ⇄ **Spring Boot 3** REST API ⇄ **PostgreSQL** (MySQL also supported).

```
student-management/
├── backend/            Spring Boot 3.5, Spring Data JPA, Spring Security (JWT), Hibernate Validator
├── frontend/           Expo (SDK 58) + TypeScript, Redux Toolkit, React Navigation, ThemeContext
└── docker-compose.yml  PostgreSQL for local dev
```

## 1. Run it

### Database
```bash
docker compose up -d          # PostgreSQL on :5433 (db studentdb, user/pass postgres/postgres)
```
No Docker? Install PostgreSQL and create a database called `studentdb`, or use MySQL (see below).

### Backend (Java 17+, Maven)
```bash
cd backend
mvn spring-boot:run           # http://localhost:8080
mvn test                      # integration test (in-memory H2, no DB needed)
```
Tables are created automatically (`ddl-auto=update`). On first start with an empty DB a demo dataset is seeded:

| Role    | Email                | Password      |
|---------|----------------------|---------------|
| TEACHER | teacher@school.com   | password123   |
| STUDENT | aarav@school.com (and 11 more) | password123 |

Config via environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (≥32 chars), `JWT_EXPIRATION_MS`, `SEED_ENABLED`.

**MySQL instead of PostgreSQL:**
```bash
DB_URL="jdbc:mysql://localhost:3306/studentdb?createDatabaseIfNotExist=true&serverTimezone=UTC" \
DB_USERNAME=root DB_PASSWORD=yourpass mvn spring-boot:run
```

### Frontend (Node 20+)
```bash
cd frontend
npm install
npx expo start                # scan the QR code with Expo Go, or press a / i for a simulator
```
The app finds the backend automatically from the Expo dev-server host (phone and computer on the same Wi-Fi).
To override (different network, ngrok/tunnel URL): copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`.
Android emulator falls back to `10.0.2.2:8080`.

> Make sure your firewall allows inbound connections on port 8080 for the live demo.

## 2. How the requirements are met

| Requirement | Where |
|---|---|
| Registration with role selection | `RegisterScreen`, `POST /api/auth/register`, `AuthService.register` |
| Login → JWT + profile + role | `POST /api/auth/login`, `JwtService`, BCrypt password hashing |
| Route protection | Frontend: `RootNavigator` mounts a different stack per auth state/role. Backend: `SecurityConfig` (stateless JWT filter, URL rules) + `@PreAuthorize("hasRole('TEACHER')")` |
| Redux Toolkit | `store/authSlice.ts`, `store/leaderboardSlice.ts`, `createAsyncThunk`, listener middleware |
| Persistent sessions | Token+profile in `expo-secure-store` (AsyncStorage on web); restored and re-validated via `GET /api/auth/me` on launch; 401 anywhere → auto-logout |
| Day / Night theme | `theme/ThemeContext.tsx`, switch in every header, choice persisted |
| Dynamic ranking, deterministic ties | Sort = points DESC, then student id ASC; `rank = 1 + count(students ahead)` (`StudentProfileRepository.countAhead`) |
| Student read-only view | `StudentHomeScreen` – own rank card + highlighted own row, no edit controls |
| Teacher award flow | `TeacherHomeScreen` → tap student → `AwardModal` → `POST /api/leaderboard/{studentId}/points` |
| Instant reorder | `awardPoints.fulfilled` updates + re-sorts the Redux list immediately, then `refreshLoaded` reconciles with the server |
| Pagination & sorting | `GET /api/leaderboard?page&size&sortBy&direction` → `PageRequest` + `Sort`; infinite scroll in the app; sort keys whitelisted |
| Schema integrity | `users.email` unique index, `student_profiles.user_id` unique FK, `points >= 0` check, default 0, `@Version` optimistic lock |
| Validation + central errors | Bean Validation on DTOs, `@RestControllerAdvice` → uniform JSON error body (below) |

## 3. REST API

All endpoints except register/login need `Authorization: Bearer <token>`.

| Method & path | Role | Body / params | Success | Errors |
|---|---|---|---|---|
| `POST /api/auth/register` | public | `{name,email,password,role}` | 201 `{token,user}` | 400 validation, 409 email taken |
| `POST /api/auth/login` | public | `{email,password}` | 200 `{token,user}` | 400, 401 wrong credentials |
| `GET /api/auth/me` | any | – | 200 `user` | 401 |
| `GET /api/leaderboard` | any | `page=0&size=10&sortBy=points\|name&direction=asc\|desc` | 200 page object | 400 bad params, 401 |
| `GET /api/leaderboard/me` | STUDENT | – | 200 entry | 404 (no student profile), 401 |
| `POST /api/leaderboard/{studentId}/points` | TEACHER | `{points}` (−1000…1000, ≠0; negative deducts) | 200 updated entry | 400 (would go below 0), 401, 403 student, 404 |

Entry: `{rank, studentId, userId, name, email, points}`.
Page: `{content[], page, size, totalElements, totalPages, first, last, sortBy, direction}`.
Error: `{timestamp, status, error, message, path, fieldErrors?}`.

Quick check with curl:
```bash
TOKEN=$(curl -s localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"teacher@school.com","password":"password123"}' | jq -r .token)
curl -s "localhost:8080/api/leaderboard?size=5" -H "Authorization: Bearer $TOKEN" | jq
curl -s -X POST localhost:8080/api/leaderboard/1/points -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"points":10}' | jq
```

## 4. Suggested live-demo script (≈5 min)

1. Open the app on a phone/simulator → **Register** a new student (shows validation + role picker).
2. Log in as a student → read-only leaderboard, your row highlighted, "Your rank" card. Pull to refresh, scroll to load page 2, change sort (Points/Name, Asc/Desc).
3. Flip the **Day/Night switch** in the header – every screen restyles instantly. Close and reopen the app: theme and login persist.
4. Logout, log in as **teacher@school.com** → "Manage Points". Tap a student, award +20 → the list reorders immediately.
5. Back on a student device/login: new ranking is visible. Show the tied students (Diya & Ananya, both 92) – lower id always first.
6. Show a 403 in a terminal: student token on `POST /api/leaderboard/1/points`; show 401 with no token; show the JSON error body.
7. Show the tables in psql (`\d users`, `\d student_profiles`) for the FK / unique constraints.

## 5. Project structure

```
backend/src/main/java/com/school/sms
  config/        SecurityConfig, DataSeeder
  controller/    AuthController, LeaderboardController
  service/       AuthService, LeaderboardService
  repository/    UserRepository, StudentProfileRepository
  entity/        User, StudentProfile, Role
  dto/           request/response records, ErrorResponse, PageResponse
  security/      JwtService, JwtAuthFilter, AuthPrincipal
  exception/     ApiException, GlobalExceptionHandler
frontend/src
  api/           axios client (token + 401 interceptor), authApi, leaderboardApi
  store/         authSlice, leaderboardSlice, store (persistence listener), typed hooks
  theme/         ThemeContext, light/dark palettes
  navigation/    RootNavigator (role-based stacks)
  screens/       Login, Register, StudentHome, TeacherHome
  components/    LeaderboardList/Row, SortBar, AwardModal, MyRankCard, ThemeToggle, AppButton/Input
  storage/       SecureStore/AsyncStorage wrappers
```
