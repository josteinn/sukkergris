// Endpoints /users ------------------------------
const express = require('express');
const multer = require('multer');
const db = require('./db.js');
const fileUtils = require('./fileutils.js');
const cfg = require('./config');

const router = express.Router();
const { secure_group, secure_user, sanitizeFormData } = require('./protect');
const { verifyPassword, createToken, decodeCred, createHash } = require('./utils');

const mem = multer.memoryStorage();
const upload = multer({ storage: mem, limits: { fileSize: 1000000, fieldSize: 500, fields: 100, files: 1, headerPairs: 100 } }); //save to buffer

// GET - users ------------------------------
router.get("/", secure_group, secure_user, async function (req, res, next) {

    try {

        let result;

        if (!req.query["userid"] || req.query["userid"].trim() == "") {
            result = await db.getAllUsers(res.locals.groupkey);
        }
        else {
            result = await db.getUserById(req.query["userid"], res.locals.groupkey);
        }

        //remove confidensial data to be sent back
        for (let row of result.rows) {
            delete row.pswhash;
            delete row.salt;
            delete row.groupkey;
        }

        res.status(200).json(result.rows).end();
    }
    catch (err) {
        next(err);
    }
});

// POST - admin user login --------------------------
router.post("/adminlogin", secure_group, async function (req, res, next) {

    try {
        let credString = req.headers.authorization;
        let cred = decodeCred(credString);

        if (cred.username.trim() == "" || cred.password.trim() == "") {
            throw new Error("DB05");
        }

        let data = await db.getAdminUser(cred.username);

        if (data.rows.length == 0) {
            throw new Error("AUTH03");
        }

        let hash = data.rows[0].pswhash;
        let salt = data.rows[0].salt;

        //verify the password
        let pswCheck = verifyPassword(cred.password, hash, salt);
        if (pswCheck == false) {
            throw new Error("AUTH03");
        }

        let userid = data.rows[0].id;
        let username = data.rows[0].username;
        let superuser = data.rows[0].superuser;
        let thumb = data.rows[0].thumb;

        //create and send the token
        let token = createToken(userid, username, superuser);
        res.status(200).json({ msg: "administrator login OK", logindata: { token, userid, username, superuser, thumb } }).end();
    }
    catch (err) {
        next(err);
    }
});

// POST - user login --------------------------------
router.post("/login", secure_group, async function (req, res, next) {

    try {
        let credString = req.headers.authorization;
        let cred = decodeCred(credString);

        if (cred.username.trim() == "" || cred.password.trim() == "") {
            throw new Error("DB04");
        }

        let data = await db.getUserByName(cred.username, res.locals.groupkey);

        if (data.rows.length == 0) {
            throw new Error("AUTH03");
        }

        let hash = data.rows[0].pswhash;
        let salt = data.rows[0].salt;

        //verify the password
        let pswCheck = verifyPassword(cred.password, hash, salt);
        if (pswCheck == false) {
            throw new Error("AUTH03");
        }

        let userid = data.rows[0].id;
        let username = data.rows[0].username;
        let superuser = data.rows[0].superuser;
        let full_name = data.rows[0].full_name;
        let street = data.rows[0].street;
        let city = data.rows[0].city;
        let zipcode = data.rows[0].zipcode;
        let country = data.rows[0].country;
        let thumb = data.rows[0].thumb;

        //create and send the token
        let token = createToken(userid, username, superuser);
        res.status(200).json({ msg: "login OK", logindata: { token, userid, username, superuser, full_name, street, city, zipcode, country, thumb } }).end();
    }
    catch (err) {
        next(err);
    }
});


// POST - add user ----------------------------------
router.post("/", secure_group, upload.single("img_file"), sanitizeFormData, async function (req, res, next) {

    try {

        let bd = req.body;

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //reached limit?
        let users = await db.getAllUsers(res.locals.groupkey);
        if (users.rows.length >= cfg.DB_RECORD_LIMIT) {
            throw new Error("DB03");
        }

        let username = req.body["username"];
        let password = req.body["password"];

        //must have username and password 
        if (!username || !password) {
            throw new Error("DB05");
        }

        let hash = createHash(password);

        //image handling
        const filename = await fileUtils.imageHandlerUser(req.file, res.locals.groupkey);

        let result = await db.addUser(username, hash.value, hash.salt, bd.fullname, bd.street, bd.city, bd.zipcode, bd.country, filename, res.locals.groupkey);

        if (result.rows.length > 0) {

            //remove confidensial data to be sent back        
            delete result.rows[0].pswhash;
            delete result.rows[0].salt;
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "insert user ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB02");
        }
    }
    catch (err) {
        next(err);
    }
})

// PUT - update user -----------------------------
router.put("/", secure_group, secure_user, upload.single("img_file"), sanitizeFormData, async function (req, res, next) {

    try {

        let bd = req.body;
        let result;
        let newHash;
        let newSalt;

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //retrieve existing data
        result = await db.getUserById(res.locals.userid, res.locals.groupkey);

        if (result.rows.length < 1) {
            throw new Error("DB01");
        }
        
        if (bd["password"]) {
            const hash = createHash(bd["password"]);
            newHash = hash.value;
            newSalt = hash.salt;
        }        

        //image handling
        let filename;
        if (req.file) {
            //add new image
            filename = await fileUtils.imageHandlerUser(req.file, res.locals.groupkey);

            //delete old image
            await fileUtils.deleteFileUser(result.rows[0].thumb, res.locals.groupkey);
        }

        //create data obj
        const fields = {
            userid: res.locals.userid,
            name: bd.username || result.rows[0].username,
            hash: newHash || result.rows[0].pswhash,
            salt: newSalt || result.rows[0].salt,
            fullname: bd.fullname || result.rows[0].full_name,
            street: bd.street || result.rows[0].street,
            city: bd.city || result.rows[0].city,
            zip: bd.zipcode || result.rows[0].zipcode,
            country: bd.country || result.rows[0].country,
            thumb: filename || result.rows[0].thumb,
            groupkey: res.locals.groupkey
        }

        result = await db.updateUser(fields);

        if (result.rows.length > 0) {
            //remove confidensial data to be sent back        
            delete result.rows[0].pswhash;
            delete result.rows[0].salt;
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "update user ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});

// DELETE - delete user -----------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

    try {

        if (req.query["id"] && !res.locals.superuser) {
            throw new Error("AUTH04");
        }

        let id = res.locals.userid; //only delete itself if normal user

        //use id from query if administrator
        if (res.locals.superuser) {

            //we must have the id
            if (!req.query["id"]) {
                throw new Error("DB05");
            }

            id = req.query["id"];
        }

        let result = await db.deleteUser(id, res.locals.groupkey);

        if (result.rows.length > 0) {

            //remove confidensial data to be sent back        
            delete result.rows[0].pswhash;
            delete result.rows[0].salt;
            delete result.rows[0].groupkey;

            //delete the image
            await fileUtils.deleteFileUser(result.rows[0].thumb, res.locals.groupkey);

            res.status(200).json({ msg: "delete user ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});

// --------------------------------------------------
module.exports = router;