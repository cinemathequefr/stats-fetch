var request = require("request-promise"); // https://github.com/request/request-promise
var config = require("./config.js")

function fail () {
  process.stdout.write("Echec\n");
  throw("Echec");
}

// TODO: pour convertir la réponse en utf8, on pourra essayer de se baser sur ce qui a été fait dans stats/week.js, qui utilise stream.
// Mais request-promise ne doit pas être utilisé pour un stream, il faut donc utiliser pour cette partie la librairie request.
// Le stream, après conversion utf8, pourra être renvoyé comme promise (package npm : stream-to-promise).

/**
 * Query
 * Demande au serveur les données entre deux dates
 * @param queryUrl {string} URL de la requête
 * @param requestBody {string} Corps de la requête (à construite à partir de templates présents dans le fichier config)
 * @return {string} Chaîne de type csv
 * @date 2017-06-13
 * @todo Convertir la réponse en utf8
 */
module.exports = (connectId, requestBody) => {
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
}
