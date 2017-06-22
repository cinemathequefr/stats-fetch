var request = require("request-promise"); // https://github.com/request/request-promise
// var Promise = require("bluebird");

/**
 * Connect
 * Tente de s'authentifier sur le serveur distant et renvoie l'ID de connexion en cas de réussite
 * @param {string} url
 * @param {string} login
 * @param {string} password
 * @return {Promise} ID de connexion
 * @date 2017-06-13
 */
module.exports = (url, login, password) => {
  process.stdout.write("Connexion au serveur : ");
  return request({
    method: "POST",
    uri: url,
    followRedirect: true,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "login=" + login + "&motPasse=" + password + "&Submit=Valider",
    simple: false,
    resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
  })
  .catch(() => null) // Interception silencieuse des erreurs pouvant survenir à ce stade (pas de réponse serveur, etc.)
  .then(res => {
    try {
      var r = res.headers.location.match(/sid=([a-z\d]+)$/)[1]; 
      process.stdout.write("OK\n");
      return r;
    } catch(e) {
      process.stdout.write("Echec\n");
      throw("Echec"); // https://stackoverflow.com/questions/21260602/how-to-reject-a-promise-from-inside-then-function
    }
  });
};