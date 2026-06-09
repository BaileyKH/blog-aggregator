import { setUser, readConfig } from "./config.js";

function main() {
  setUser("Bailey")
  console.log(readConfig())
}

main();