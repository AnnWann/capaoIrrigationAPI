export function getEweLinkCredentials() {
  const eWelink = require("ewelink-api");

  const conn = new eWelink({
    email: process.env.EWELINK_EMAIL,
    password: process.env.EWELINK_PASSWORD,
  });

  return conn;
}