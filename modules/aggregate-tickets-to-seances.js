var _ = require("lodash");
var config = require("./config.js");

module.exports = data => _(data)
  .map(function (item) {
    return _.assign({}, item, { montant: parseFloat((item.montant || "0").replace(",", ".")) });
  })
  .groupBy("idSeance")
  .map(function (items) {
    return {
      idSeance: items[0].idSeance,
      idManif: items[0].idManif,
      titre: items[0].titre,
      date: items[0].date,
      salle: config.salles[items[0].idSalle],
      tickets: {
        compte: items.length,
        recette: _.sumBy(items, item => item.montant),
        tarif: _(items).groupBy("tarif").mapValues(item => item.length).value(),
        tarifCat: _(items).reduce(function (acc, item) {
          return _({}).assign(acc, (function (item) {
            if (_.indexOf(config.codesTarifsLp, item.tarif) > -1) return { lp: acc.lp + 1 }; // Codes tarifaires Libre Pass
            if (item.montant == 0) return { gratuit: acc.gratuit + 1 };
            return { payant: acc.payant + 1 };
          })(item))
          .value()
        }, { payant: 0, lp: 0, gratuit: 0 }),
        web: _(items).filter(function (item) { return _.indexOf(config.codesCanalWeb, item.idCanal) > -1; }).value().length // Codes canal de vente web
      }
    };
  })
  .filter(function (d) { return !_.isUndefined(d.salle); }) // Retire les items hors salle de cinéma
  .sortBy("date")
  .value();