// Endpoints /messages ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const { secure_group, secure_user } = require('./protect');
const cfg = require('./config');
const { text } = require('express');

// GET - get messages ---------------------------------
router.get("/", secure_group, secure_user, async function (req, res, next) {

    try {

        if (req.query["thread"]) {
            result = await db.getMessagesInThread(req.query["thread"], res.locals.groupkey);
        }
        else {
            if (req.query["all"]) {
                if (req.query["all"] == "true") {

                    if (req.query["asc"]) {
                        if (req.query["asc"] == "true") {
                            result = await db.getAllMessagesAsc(res.locals.groupkey);
                        }
                        else {
                            result = await db.getAllMessagesDesc(res.locals.groupkey);
                        }
                    }
                    else {
                        result = await db.getAllMessagesDesc(res.locals.groupkey);
                    }
                }
                else {
                    result = await db.getUserMessages(res.locals.userid, res.locals.groupkey);
                }
            }
            else {
                result = await db.getUserMessages(res.locals.userid, res.locals.groupkey);
            }
        }



        for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }

        res.status(200).json(result.rows).end();
    }
    catch (err) {
        next(err);
    }

});

// POST - add message ---------------------------------
router.post("/", secure_group, secure_user, async function (req, res, next) {

    try {

        let bd = req.body;
        let result;

        //wrong content-type?
        if (req.headers["content-type"].search(/application\/json/i) == -1) {
            throw new Error("SRV01");
        }

        //reached limit?
        let messages = await db.getAllMessagesAsc(res.locals.groupkey);
        if (messages.rows.length >= cfg.DB_RECORD_LIMIT) {
            throw new Error("DB03");
        }

        //message thread
        if (!req.query["thread"]) {
            result = await db.addMessageNewThread(bd.heading, bd.message_text, res.locals.userid, res.locals.groupkey);
        }
        else {
            let chkThread = await db.checkMessageThread(req.query["thread"], res.locals.groupkey);
            if (chkThread.rows.length == 0) {
                throw new Error("DB01");
            }
            result = await db.addMessageOldThread(bd.heading, bd.message_text, req.query["thread"], res.locals.userid, res.locals.groupkey);
        }

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "insert message ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB02");
        }

    }
    catch (err) {
        next(err);
    }
});

// DELETE - delete message ---------------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

    try {
        let result;

        // we must have the id
        if (!req.query["message_id"]) {
            throw new Error("DB05");
        }
        
        let message_id = req.query["message_id"];        

        if (res.locals.superuser == true) {
            result = await db.deleteMessage(message_id, res.locals.groupkey);
        }
        else {
            result = await db.deleteUserMessage(message_id, res.locals.userid, res.locals.groupkey);
        }

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "delete message ok", record: result.rows[0] }).end();
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