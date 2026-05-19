const { error } = require('console');
const fs = require('fs')
const path = require('path')

function loadUser() {
  const filePath = path.join(__dirname, "..", "user.json");

  if (!fs.existsSync(filePath)) {
    throw new error(`user.json not found at :${filePath}`)
  }

  const rawData = fs.readFileSync(filePath, "utf-8")

  const users = JSON.parse(rawData)

  if (!Array.isArray(users)) {
    throw new error('user.json must return an array of objects')
  }
  users.forEach((user, index) => {
    const required = ['username', "email", "firstName", "lastName", "password"];
    required.forEach((field) => {
      if (!user[field]) {
        throw new error(`user at index ${index} is missing a required field ${field}`);
      }
    });
  });
  return users;
}

module.exports = { loadUser };
