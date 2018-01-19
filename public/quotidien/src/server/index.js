"use strict";

const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");
const fs = require("fs");
const _ = require("lodash");

// const moment = require("moment");
const router = require("./routes");

const app = new Koa();
const PORT = process.env.PORT || 1337;

// console.log(process.env);



app.use(serve(__dirname + "/assets", {}));
app.use(views(__dirname + "/views", { map: { html: "lodash" } }));
app.use(router.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = server;