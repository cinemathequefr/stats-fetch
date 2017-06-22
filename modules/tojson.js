var csvtojson = require("csvtojson");

module.exports = (csv => {
  return new Promise((resolve, reject) => {
    var o = [];
    csvtojson({
      delimiter: ";",
      toArrayString: true,
      noheader: false,
      headers: ["idCanal", "idManif", "titre", "idSeance", "date", "idSalle", "montant", "tarif"]
    })
    .fromString(csv)
    .on("json", row => o.push(row))
    .on("error", err => reject(err))
    .on("done", () => resolve(o));
  });
});