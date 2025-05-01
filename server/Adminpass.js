const bcrypt = require("bcrypt");

(async () => {
  const password = "123"; // înlocuiește cu parola dorită
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log("Parolă hashuită:", hash);
})();
