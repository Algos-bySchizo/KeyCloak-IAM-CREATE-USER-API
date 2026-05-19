const { getAdminToken } = require("./auth.js")
const { loadUser } = require("./userLoader.js")
const { createUser } = require("./userService.js")

async function main() {

  const keycloakUrl = process.env.KEYCLOAK_URL || process.env.keycloakUrl;
  const realm = process.env.REALM;
  const adminUser = process.env.KEYCLOAK_ADMIN;
  const adminPass = process.env.KEYCLOAK_ADMIN_PASSWORD;

  console.log(`\n Target Realm: ${realm}`)
  console.log(`\n Keycloak URL: ${keycloakUrl}`)

  const users = loadUser();
  console.log(`loaded all ${users.length} user(s) to create. \n`)

  const token = await getAdminToken(keycloakUrl, "master", adminUser, adminPass);
  console.log(`Admin Token Obtained.\n`)

  for (const user of users) {
    try {
      await createUser(keycloakUrl, realm, token, user);
    } catch (err) {
      if (err.response?.status === 409) {
        console.warn(`User already exist: ${user.username}`)
      } else {
        const reason = err.response?.data?.errorMessage || err.message;
        console.error(`Failed:${user.username} -> ${reason}`);
      }
    };
  }

  console.log("\n Done.")
}
main();
