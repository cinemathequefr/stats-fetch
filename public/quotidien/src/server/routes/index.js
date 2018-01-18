"use strict";

const Router = require("koa-router");
const moment = require("moment");
const queries = require("../db/queries");
const config = require("../config");
const _ = require("lodash");

const router = new Router();


function extendSeances (data) {
  return _(data)
  .map(d => _(d).assign({ tickets: _(d.tickets).assign({ tarifCat2: tarifCat(d.tickets.tarif, config.tarifCats) }).value() }).value())
  .value();
}

/** 
 * tarifCat
 * A partir du nombres de billets vendus par code tarifaire et d'une liste de catégories des codes tarifaires, on obtient le nombre de billets vendus par catégorie
 * L'ordre de sortie suit l'ordre d'énumération des catégories tarifaires (`cats`)
 * @param tarif {Object} {"code1": compte1, "code2": compte2, ...}
 * @param cats {Array} [["cat1": [code1, code2, code3, ...]], ["cat2": [code4, code5, ...]], ...]
 * @return {Array} [["cat1": compte1], ["cat2": compte2], ...]
 */
function tarifCat (tarif, cats) {
  return _(
    _(tarif).map((v, k) => {
      return _.fromPairs([[
        _(_.fromPairs(cats)).findKey(c => _.indexOf(c, parseInt(k, 10)) > -1) || "Autres",
        v
      ]]);
    })
    .reduce((acc, item) => {
      return _({}).assignWith(acc, item, (a, b) => _.sum([a, b])).value();
    })
  )
  .toPairs()
  .sortBy(d => {
    return _(cats).map((e, i) => [e[0], i]).fromPairs().value()[d[0]]
  })
  .value()
}






// Date
router.get("/date/:date", async (ctx, next) => {
  try {
    const date = ctx.params.date;
    const data = queries.date(date);
    // console.log(data);
    console.log(extendSeances(data));
    // return;
    // return await ctx.render("date", { moment: moment, data: data });
    return await ctx.render("date", { moment: moment, data: extendSeances(data) });

  } catch (err) {
    console.log(err);
  }
});

module.exports = router;