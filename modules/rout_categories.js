// Endpoints /categories ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const { secure_group } = require('./protect.js');
const cfg = require('./config.js');

// GET - get categories ---------------------------------
router.get("/", secure_group, async function (req, res, next) {

    try {
        let result = await db.getCategories();

        for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }

        //for oral hearing - test with an error        
        if (cfg.createError && cfg.errorGroup == req.query["key"].toLowerCase()) {
            res.status(500).json({
                msg: "The server is down for maintenance. Try again in 5 minutes",
                code: "SRV00",
                http_code: 500
            }).end();
        }
        else {
            res.status(200).json(result.rows).end();
        }

    }
    catch (err) {
        next(err);
    }

});

// --------------------------------------------------
module.exports = router;