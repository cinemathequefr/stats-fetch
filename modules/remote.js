var request = require("request-promise"); // https://github.com/request/request-promise
var csvtojson = require("csvtojson"); // https://github.com/Keyang/node-csvtojson
var config = require("./config.js");


/**
 * Connect
 * Tente une connexion/authentification sur le serveur distant et renvoie l'ID de connexion en cas de réussite
 * @param {string} url
 * @param {string} login
 * @param {string} password
 * @return {Promise} ID de connexion
 * @date 2017-06-13
 */
function connect (url, login, password) { // TODO? : utiliser directement les données de config
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
}


/**
 * Query
 * Fait une requête
 * @param queryUrl {string} URL de la requête
 * @param requestBody {string} Corps de la requête (à construite à partir de templates présents dans le fichier config)
 * @return {string} Chaîne de type csv
 * @date 2017-06-13
 * @todo Convertir la réponse en utf8
 */
function query (connectId, requestBody) {
  process.stdout.write("Envoi de la requête : ");
  return request({
    method: "POST",
    uri: config.queryUrl,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": config.cookieKey + "=" + connectId
    },
    json: true,
    body: requestBody
  })
  .catch(() => null)
  .then(res => {
    var p;

    try {
      var sessionId = res.data.sessionId;
    } catch(e) {
      fail();
    }

    process.stdout.write("OK\n");
    process.stdout.write(sessionId + "\n");
    process.stdout.write("Récupération des données : ");

    try {
      p = request({
        method: "GET",
        uri: config.queryUrl + "&op=dl&format=csv&id=" + sessionId,
        headers: {
          "Cookie": config.cookieKey + "=" + connectId
        },
        json: false,
        resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
      })
      .catch(() => null)
    } catch(e) {
      fail();
    }

    return p.then(res => {
      try {
        if (res.headers["content-disposition"].substring(0, 10) === "attachment") { // Vérifie que la réponse est un attachement
          process.stdout.write("OK\n");
          return res.body; // TODO: convertir en utf8
        } else {
          fail();
        }
      } catch(e) {
        fail();
      }
    });
  });  

  function fail () {
    process.stdout.write("Echec\n");
    throw("Echec");
  }
}


/**
 * toJson
 * Convertit une chaîne CSV en JSON
 * @param {string} csv
 * @return {string} json
 * @todo : passer les headers en paramètres
 */
function toJson (csv) {
 return new Promise((resolve, reject) => {
    var o = [];
    csvtojson({
      delimiter: ";",
      toArrayString: true,
      noheader: false,
      checkType: true, // Type inference
      headers: ["idCanal", "idManif", "titre", "idSeance", "date", "idSalle", "montant", "tarif"]
    })
    .fromString(csv)
    .on("json", row => o.push(row))
    .on("error", err => reject(err))
    .on("done", () => resolve(o));
  });
}


module.exports = {
  connect: connect,
  query: query,
  toJson: toJson
};