// Mise à jour des données de séances

var moment = require("moment");
var fs = require("fs");
var _ = require("lodash");
var config = require("./modules/config.js");
var remote = require("./modules/remote.js");
var aggregateTicketsToSeances = require("./modules/aggregate-tickets-to-seances.js");

var mode = _.indexOf(["--past", "--future", "--all"], process.argv[2]) > -1 ? process.argv[2] : "--all";
var force = process.argv[3] === "--force"; // Pour les séances passées, force une requête sur la totalité des données
var dateTo;
var currentDateTime = moment().startOf("day"); // On capture la date courante (pour utiliser la même valeur)
var initialSeances; // Données initiales séances passées // TODO : pas de global, passer cette valeur à la résolution de la promesse de getDate (fonction à renommer)

new Promise((resolve, reject) => {
  if (mode === "--past" || mode === "--all") {
    if (force) {
      resolve(moment(config.firstDate));
    } else {
      calcDateFrom().then(dateFrom => {
        if (mode === "--past" && dateFrom === null) {
          reject("Pas de mise à jour nécessaire.");
        } else if (dateFrom === null) {
          dateFrom = today();
        }
        resolve(dateFrom);
      })
      .catch(reason => { reject(reason); });
    }
  } else {
    resolve(today());
  }
})
.then(dateFrom => {
  dateTo = mode === "--past" ? yesterday() : currentDateTime.clone().add(config.lookAheadDays, "days");
  return remote.connect(config.connectUrl, config.login, config.password)
  .then(connectId => {
    return remote.query(
      connectId,
      _.template(config.requestTemplates.tickets)({
        dateFrom: dateFrom.format("YYYY-MM-DD"),
        dateTo: dateTo.format("YYYY-MM-DD")
      })
    );
  });
})
.then(tickets => remote.toJson(tickets)) // Convertit la réponse csv en json
.then(tickets => {
  var seances = aggregateTicketsToSeances(tickets);
  var split = splitSeances(seances);

  if (mode === "--all" || mode === "--past") {
    if (split[0].length > 0) {
      fs.writeFile("./data/seances.json", JSON.stringify(mergeSeances(initialSeances, split[0]), null, 2), "utf8", (err) => { console.log("Séances passées : " +  split[0].length + " séances ajoutées."); });
    } else {
      console.log("Séances passées : aucune séance ajoutée.")
    }
  }

  if (mode === "--all" || mode === "--future") {
    if (split[1].length > 0) {
      fs.writeFile("./data/future.json", JSON.stringify(split[1], null, 2), "utf8", (err) => { console.log("Séances à venir : " + split[1].length + " séances."); });
    } else {
      console.log("Séances à venir : aucune séance.")
    }
  }
})
.catch(reason => {
  console.log(reason);
});


/**
 * mergeSeances
 * Fusionne un tableau de séances (initial) avec un tableau de séances supplémentaires (ajouts).
 * En cas de collision, les séances ajoutées sont prioritaires.
 * @param {Object} seances : collection de séances
 * @param {Object} added : collection de séances
 */
function mergeSeances (seances, added) {
  return _(seances).concat(added).groupBy("idSeance").map(_.last).sortBy("date").value();
}


/**
 * splitSeances
 * Divise une collection de séances en deux collections : les séances passées (jusqu'à hier 23:59:00 inclus) et les séances futures (à partir d'aujourd'hui 00:00:00 inclus)
 * @param {Object} seances : collection de séances
 */
function splitSeances (seances) {
  return _(seances).partition(d => moment(d.date).isBefore(currentDateTime, "day")).value();
}


/**
 * calcDateFrom
 * Détermine la date de début pour la requête de données séances
 * - La date la plus récente pour laquelle des données sont déjà présentes dans seances.json (mais au plus tard hier)
 * - Si on ne peut pas la déterminer, la date de début historique des données
 * @return {string} Date au format YYYY-MM-DD
 * @todo : Séparer en deux promesses distinctes et consécutives : lecture de seances.json, puis détermination de la date de début de requête
 */
function calcDateFrom () {
  var dateLastAvailable;
  return new Promise((resolve, reject) => {
    var reason = "La date de début de mise à jour n'a pas pu être déterminée. Vérifier le fichier de données ou utiliser le flag --force";
    fs.readFile("./data/seances.json", "utf8", (err, data) => {

      try {
        initialSeances = JSON.parse(data); // IMPORTANT : initialSeances est global et servira pour la fusion avec les séances passées ajoutées (la promesse aura été résolue) TODO: plutôt passer cette valeur dans la résolution de la promesse
      } catch(e) {
        initialSeances = [];
      }

      if (err) {
        reject(reason);
      } else {
        try {
          dateLastAvailable =  moment(moment.max(_(JSON.parse(data)).map(d => moment(d.date)).value()));
          if (dateLastAvailable.isSame(yesterday(), "day")) {
            resolve(null);
          } else {
            resolve(dateLastAvailable.add(1, "days"));
          }
        } catch(e) {
          console.log(e);
          reject(reason);
        }
      }
      resolve(dateLastAvailable);
    });
  });
}


/**
 * yesterday
 * Détermine la date d'hier, qui sert de date finale des données passées
 * Une exception est faite pour le mardi (renvoie le lundi)
 * @return {object} moment
 */
function yesterday () {
  var y = currentDateTime.clone().subtract(1, "day");
  return y.isoWeekday() === 2 ? y.clone().subtract(1, "day") : y;
}


/**
 * today
 * Aujourd'hui (ou demain si on est mardi)
 * @return {object} moment
 *
 */
function today () {
  return currentDateTime.isoWeekday() === 2 ? currentDateTime.clone().add(1, "day") : currentDateTime;
}