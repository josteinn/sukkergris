

const connstring = process.env.DATABASE_URL || process.env.DB_URL;

const keyTxt = "ADMIN001 CUNQBX06 TWDOBS42 SJUCSM30 CONFJK37 ERODFG54 IHXMXX83 CKXDXF73 ONUNKI48 VNWNUW92 RSGDUF54 EYGVCY44 CFSITA51 HZFUMA98 VJEJYH54 FGOZMJ60 OLMALY81 YYUZXD18 BQPHVM69 LATZPN54 JABYVL84 SZGUBU13 ONVCNE71 LHLVNM23 FCLZSO83 LRXBKK98 UKXZSA15 VUPCZD38 ISXUPH36 JQPTBC52 PRGWJV30";
const grKeys = keyTxt.split(" ");

cfg = {
    DB_RECORD_LIMIT: 200,
    DB_CRED: connstring,
    SECRET: "Dronning Mauds Land",
    groupkeys: grKeys,
    createError: false,
    errorGroup: null
}

module.exports = cfg;



//const conString = "postgres://YourUserName:YourPassword@YourHostname:5432/YourDatabaseName";