

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const cfg = require('./config.js');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------
exports.decodeCred = function (credString) {

    let cred = {};

    try {

        let b64String = credString.replace(/basic /i, "");
        let asciiString = Buffer.from(b64String, "base64").toString("ascii"); // 'josteinn:kongolav'	
        cred.username = asciiString.replace(/:.*/, ""); //josteinn	
        cred.password = asciiString.replace(cred.username + ":", ""); //kongolav
        
        return cred;
    }
    catch (error) {

        cred.username = "";
        cred.password = "";

        return cred;
    }
}

// ---------------------------------------------
exports.createHash = function (password) {

    let hash = {};

    hash.salt = Math.random().toString();
    hash.value = crypto.scryptSync(password, hash.salt, 64).toString("hex");

    return hash;
}

// ---------------------------------------------
exports.verifyPassword = function (pswFromUser, hashFromDB, saltFromDB) {

    hash = crypto.scryptSync(pswFromUser, saltFromDB, 64).toString("hex");

    if (hash == hashFromDB) {
        return true;
    }

    return false;
}

// ---------------------------------------------
exports.createToken = function (userid, username, superuser) {

    try {
        let token = jwt.sign({
            data: { userid, username, superuser }
        }, cfg.SECRET, { expiresIn: '12h' });

        return token;
    }
    catch (err) {
        throw (err);
    }
}

// ---------------------------------------------
exports.createBoxToken = function (box_name) {

    try {
        let token = jwt.sign({
            data: { box_name }
        }, cfg.SECRET, { expiresIn: '50000h' });

        return token;
    }
    catch (err) {
        throw (err);
    }
}

// ---------------------------------------------
exports.verifyToken = function (token) {

    token = token.replace(/bearer /i, "");

    try {
        let payload = jwt.verify(token, cfg.SECRET);
        return payload;
    }
    catch (err) {
        throw new Error("AUTH02");
    }
}

//--------------------------------------------------------
exports.createProductNumber = function (prefix) {

    let code_length = 4;
    const txt = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    let code = "";
    for (let i = 0; i < code_length; i++) {
        code += txt.at(Math.floor(Math.random() * txt.length));
    }

    const d = new Date();
    code = prefix + "-" + code + "-" + d.getDay() + "-" + d.getSeconds();

    return code;
}


//--------------------------------------------------------
exports.generateRandomFilename = function (originalname, groupkey) {
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalname);
    return `${groupkey}-${randomString}${extension}`;
}

//--------------------------------------------------------
exports.trimObjectStrings = function (obj) {

    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        }
    }
}

//---------------------------------------------------
exports.getOrderNumber = function () {

    let id_length = 6;
    const txt = "BFTUIOEFDGHYTRJKHGASERTGHNBRTREEFGHN";

    let id_txt = "";
    for (let i = 0; i < id_length; i++) {
        let rnd = Math.floor(Math.random() * txt.length);
        id_txt += txt.charAt(rnd);
    }

    return "ORD-" + id_txt + "-Y2024";
}





