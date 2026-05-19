const axios = require("axios")

async function createUser(keycloakUrl, realm, token, user) {
  const url = `${keycloakUrl}/admin/realms/${realm}/users`;

  await axios.post(
    url,
    {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: "password",
          value: user.password,
          temporary: false,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { createUser };
