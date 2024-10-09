// Endpoints /orders ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const {secure_group, get_cred, secure_user } = require('./protect');
const cfg = require('./config');
const { getOrderNumber } = require('./utils');

// GET - get orders ---------------------------------
router.get("/", secure_group, secure_user, async function (req, res, next) {

    try {
        let result;        

        if (res.locals.superuser == true) {

            let orderId = req.query["order_id"];
            
            if (orderId) {
                result = await db.getOrder(orderId, res.locals.groupkey);
            }
            else {
                result = await db.getAllOrders(res.locals.groupkey);
            }
            
        }
        else {
            result = await db.getMemberOrders(res.locals.userid, res.locals.groupkey);
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

// POST - add order ---------------------------------
router.post("/", secure_group, get_cred, async function (req, res, next) {

    try {
        
        let result;
        let bd = req.body;

        //wrong content-type?
		if(req.headers["content-type"].search(/application\/json/i) == -1) {            
			throw new Error("SRV01");
		}

        //reached limit?
		let orders = await db.getAllOrders(res.locals.groupkey);
		if (orders.rows.length >= cfg.DB_RECORD_LIMIT) {
			throw new Error("DB03");
		}

        let content;
        if (!bd.content) content = "{}";
        else content = JSON.stringify(bd.content);       
        
        let ordernum = getOrderNumber();

        //create data obj
        const fields = {
            name: bd.customer_name,
            street: bd.street,
            city: bd.city,
            zip: bd.zipcode,
            country: bd.country,
            shipId: bd.shipping_id || 3,
            content: bd.content,
            userId: res.locals.userid || null,
            orderNumber: ordernum,
            groupkey: res.locals.groupkey,
            email: bd.email,
            phone: bd.phone || null
        };
        
		result = await db.addOrder(fields);		
		
        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;     
            res.status(200).json({msg: "insert order ok", record: result.rows[0]}).end();
        }
        else {
            throw new Error("DB02");
        }								
	}
	catch(err) {

        if (err.code == "23503") { //wrong shipping id
            err.message = "DB04"; //missing or bad input
        }

		next(err);
	}
});

// DELETE - delete order ---------------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

    try {        

        //not administrator?
		if (res.locals.superuser == false) {
			throw new Error("AUTH04");
		}       

        let orderId = req.query["id"];

        // we must have the id
        if (!orderId) {
            throw new Error("DB05");
        }        
        
        const result = await db.deleteOrder(orderId, res.locals.groupkey);        

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;        
            res.status(200).json({msg: "delete order ok", record: result.rows[0]}).end();
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