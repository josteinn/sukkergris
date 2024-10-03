// Endpoints /categories ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const {secure_group} = require('./protect.js');
const cfg = require('./config.js');

// GET - get log --------------------------------------
router.get("/", secure_group, async function (req, res, next) {

    try {  
        
        if (res.locals.groupkey != "KSRIVC32") {
            throw new Error("AUTH01");
        }

        let result = await db.getLog();        
        res.status(200).json(result.rows).end();
     					
	}
	catch(err) {		
		next(err);
	}    	

});

// --------------------------------------------------
module.exports = router;