
// Endpoints /shipping ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const {secure_group} = require('./protect');
const cfg = require('./config');

// GET - get categories ---------------------------------
router.get("/", secure_group, async function (req, res, next) {

    try {        
        let result = await db.getShipping();
		
		for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }
		
		res.status(200).json(result.rows).end();						
	}
	catch(err) {		
		next(err);
	}	    	

});

// --------------------------------------------------
module.exports = router;