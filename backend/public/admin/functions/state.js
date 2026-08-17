// Shared mutable app state. Not a function itself — split out because
// several function modules need to read/write it, and a plain `let` export
// can't be reassigned from another module per the ES module spec, so
// mutation goes through these getter/setter pairs instead.
export const API = "";

let token = localStorage.getItem("admin_token") || "";
export function getToken() {
  return token;
}
export function setToken(value) {
  token = value;
}

let userSearch = "";
export function getUserSearch() {
  return userSearch;
}
export function setUserSearch(value) {
  userSearch = value;
}
