// Endpoints /comments ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const {secure_group, secure_user, get_cred } = require('./protect');
const cfg = require('./config');

// GET - get comments ---------------------------------
router.get("/", secure_group, get_cred, async function (req, res, next) {

    try {
        
        let result;
        
        if (req.query["plant_id"]) {
            let plant_id = req.query["plant_id"].trim();
            result = await db.getAllCommentsByPlant(plant_id, res.locals.groupkey); 
        }
        else {
            if (res.locals.superuser) {
                result = await db.getAllComments(res.locals.groupkey);  
            }
            else if (res.locals.userid) {
                result = await db.getAllCommentsByUser(res.locals.userid, res.locals.groupkey);
            }
            else {
                throw new Error("DB05");
            }             
        }
        
        for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }
        
                       
		res.status(200).json(result.rows).end();						
	}
	catch(err) {		
		next(err);
	}	    	

});

// POST - add comment ---------------------------------
router.post("/", secure_group, secure_user, async function (req, res, next) {

    try {        
        
        let bd = req.body;        
        
        //wrong content-type?
		if(req.headers["content-type"].search(/application\/json/i) == -1) {
			throw new Error("SRV01");
		}

        //reached limit?
		let comments = await db.getAllComments(res.locals.groupkey);
		if (comments.rows.length >= cfg.DB_RECORD_LIMIT) {
			throw new Error("DB03");
		}

        //can't add comments for other plants than: static and in the group
        let product = await db.getProduct(bd.plant_id, res.locals.groupkey);
        if (product.rows.length == 0) {
            throw new Error("DB07");
        }

        const rating = bd.rating || 1;
        
        let result = await db.addComment(bd.comment_text, rating, bd.plant_id, res.locals.userid, res.locals.groupkey);
		
        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;       
            res.status(200).json({msg: "insert comment ok", record: result.rows[0]}).end();
        }
        else {
            throw new Error("DB02");
        }        		
								
	}
	catch(err) {		
		next(err);
	}
});

// DELETE - delete comment ---------------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

    try {
        let result;        

        let comment_id = req.query["comment_id"];
        
        // we must have the id
        if (!comment_id) {
            throw new Error("DB05");
        }
        
        if (res.locals.superuser == true) {
            result = await db.deleteComment(comment_id, res.locals.groupkey);
        }
        else {
            result = await db.deleteUserComment(comment_id, res.locals.userid, res.locals.groupkey);
        }

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;        
            res.status(200).json({msg: "delete comment ok", record: result.rows[0]}).end();
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