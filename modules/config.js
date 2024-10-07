

const connstring = process.env.DATABASE_URL || process.env.DB_URL;
const secret = process.env.SECRET;

const keyTxt = process.env.GROUP_KEYS;

const grKeys = keyTxt.split(" ");

cfg = {
    DB_RECORD_LIMIT: 200,
    DB_CRED: connstring,
    SECRET: secret,
    groupkeys: grKeys,
    createError: false,
    errorGroup: null
}

module.exports = cfg;



//const conString = "postgres://YourUserName:YourPassword@YourHostname:5432/YourDatabaseName";