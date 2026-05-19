const axios = require("axios");

async function getAdminToken(keycloakUrl, realm, adminUser, adminPass) {
  const url = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "password",   // we're authenticating with a username + password
    client_id: "admin-cli",   // Keycloak's built-in client meant for admin API access
    username: adminUser,
    password: adminPass,
  });

  const response = await axios.post(url, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data.access_token;
}

module.exports = { getAdminToken };
