// Endpoints /beenz ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const {secure_group, secure_user} = require('./protect');
const cfg = require('./config');



// PUT - add/change beenz ---------------------------------
router.put("/", secure_group, secure_user, async function (req, res, next) {

    try {       
        
        //superuser isn't allowd to give beenz
        if (res.locals.superuser) {
            throw new Error("AUTH05"); 
        }
        
        //wrong content-type?
		if(req.headers["content-type"].search(/application\/json/i) == -1) {
			throw new Error("SRV01");
		}
        
        //reached limit?
		let beenz = await db.getAllBeenz(res.locals.groupkey);
		if (beenz.rows.length >= cfg.DB_RECORD_LIMIT) {
			throw new Error("DB03");
		}

        // we must have the userid and beens
        if (!req.body["userid"] || !req.body["beenz"]) {
            throw new Error("DB05");
        }

        //can't add beenz for yourself (logged-in user)
        if (req.body["userid"] == res.locals.userid) {
            throw new Error("DB07");
        }
        
        //Number of beenz must be between 1 and 5
        let b = parseFloat(req.body["beenz"])
        if (b < 1 || b > 5) {
            throw new Error("DB12");
        }
            

        //get the infleunce for the logged in user (the judge)
        let influence = 1; //default influence
        let user = await db.getUserById(res.locals.userid, res.locals.groupkey);       
        
        if (user.rows[0].beenz) {
            influence = user.rows[0].beenz;
        }       
        
        const beenzGiven = req.body["beenz"]; 
        
        //check if the logged in user ("judge") has already given beenz for the user
        let result;
        let tst = await db.getBeenzByUser(res.locals.userid, req.body["userid"], res.locals.groupkey);
        if (tst.rows.length > 0) {
            let id = tst.rows[0].id;
            result = await db.updateBeenz(beenzGiven, influence, id, res.locals.groupkey);
        }
        else {
            result = await db.addBeenz(req.body["userid"], beenzGiven, influence, res.locals.userid, res.locals.groupkey);
        }                
		
        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;       
            res.status(200).json({msg: "insert/update beenz ok", record: result.rows[0]}).end();
        }
        else {
            throw new Error("DB02");
        }        		
								
	}
	catch(err) {		
		next(err);
	}
});

// DELETE - delete beenz for a user ------------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

    try {      

        let result;

        //administrator?
		if (res.locals.superuser) {
			result = await db.deleteAllBeenz(res.locals.groupkey);
		}
        else {
            result = await db.deleteBeenz(res.locals.userid, res.locals.groupkey);
        }               

        if (result.rows.length > 0) {
            for (let row of result.rows) {
				delete row.groupkey; //delete "confidential data"				
			}        
            res.status(200).json({msg: "delete beenz ok", record: result.rows}).end();
        }
        else {
            throw new Error("DB01");
        }								
	}
	catch(err) {		
		next(err);
	}	

});

// --------------------------------------------------
module.exports = router;