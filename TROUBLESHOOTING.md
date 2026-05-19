~# Troubleshooting Report: Keycloak & User-Creator Build Fixes

This document details the issues encountered during `docker compose up --build` and the fixes implemented to resolve them.

---

## 1. Directory-as-File Conflict (`keycloak-realm.json`)

### **The Issue**
The `docker-compose.yml` mounts a host file `./keycloak-realm.json` to the Keycloak container:
```yaml
volumes:
  - ./keycloak-realm.json:/opt/keycloak/data/import/keycloak-realm.json
```
If the file does not exist locally at start, Docker assumes the source path is a directory and automatically creates an empty directory named `keycloak-realm.json` on the host. This caused Keycloak to fail importing the realm with:
```text
ERROR: Failed to import realms
ERROR: Is a directory
```

### **The Fix**
1. Removed the empty directory `./keycloak-realm.json`.
2. Extracted the real JSON definition from `app/keycloak-realm.json ` (which had a trailing space in its filename).
3. Created a new valid JSON file at `./keycloak-realm.json`.
4. Deleted the duplicate/spaced `app/keycloak-realm.json ` file to clean up the workspace.

---

## 2. Healthcheck command failure (`wget: command not found`)

### **The Issue**
`docker-compose.yml` specified:
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -q -O - http://localhost:8080/realms/master | grep -q 'master'"]
```
Since the `quay.io/keycloak/keycloak:24.0.1` image is highly optimized and minimal, it does not include `wget` or `curl`. This caused the healthcheck to continuously exit with code 127 (`wget: command not found`), rendering Keycloak permanently `unhealthy` and preventing `user-creator` (which depends on Keycloak's health status) from ever launching.

### **The Fix**
Changed the healthcheck test to a bash-native socket test:
```yaml
healthcheck:
  test: ["CMD", "bash", "-c", "exec 3<>/dev/tcp/127.0.0.1/8080"]
```

---

## 3. Incorrect Dockerfile entrypoint

### **The Issue**
The `app/Dockerfile` had the command:
```dockerfile
CMD ["node", "index.js"]
```
However, the source files are inside `src/`. The container would look for `/app/index.js` which does not exist, causing it to crash immediately upon launch.

### **The Fix**
Updated the command in `app/Dockerfile` to point to the correct index file:
```dockerfile
CMD ["node", "src/index.js"]
```

---

## 4. Typos and Bugs in JS Code

### **`userService.js` parameter typo**
* **Issue**: The API URL was built using `${realms}` instead of `${realm}`, causing request URLs to resolve with `undefined` realm path.
* **Fix**: Replaced `${realms}` with `${realm}` in `app/src/userService.js`.

### **Environment variable naming mismatch**
* **Issue**: `index.js` looked up `process.env.keycloakUrl` (camelCase) while `docker-compose.yml` set `KEYCLOAK_URL` (UPPERCASE).
* **Fix**: Updated `app/src/index.js` to look for `process.env.KEYCLOAK_URL || process.env.keycloakUrl`.

### **Incorrect realm for admin token**
* **Issue**: `index.js` retrieved the admin token by authenticating against `"test-realm"`. However, the administrator credentials (`admin`/`admin`) created on Keycloak startup belong to the `"master"` realm.
* **Fix**: Changed the token request realm from `"test-realm"` to `"master"`.

---

## Verification Results

Running `docker compose up --build` now successfully:
1. Augments Quarkus and starts Keycloak.
2. Imports the `myrealm` realm using the root `keycloak-realm.json` file.
3. Successfully registers the `admin` user on the `master` realm.
4. Changes Keycloak container state to `healthy`.
5. Triggers the `user-creator` container which successfully fetches the admin token from `master` and creates the three users from `user.json` in the `myrealm` realm.
