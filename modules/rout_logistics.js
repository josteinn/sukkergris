// Endpoints /categories ------------------------------
const express = require('express');
const db = require('./db.js');
const router = express.Router();
const { secure_group, secure_user } = require('./protect.js');
const { createBoxToken, verifyToken } = require('./utils');
const cfg = require('./config.js');

// POST - add shipment ---------------------------------
router.post("/shipments", secure_group, secure_user, async function (req, res, next) {

    try {
        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        //wrong content-type? ------
        if (req.headers["content-type"].search(/application\/json/i) == -1) {
            throw new Error("SRV01");
        }
        
        //reached limit?
		let shipments = await db.getAllShipments(res.locals.groupkey);
		if (shipments.rows.length >= cfg.DB_RECORD_LIMIT) throw new Error("DB03");		

        let bd = req.body;
        
        let orderID = bd["order_id"];
        let boxID = bd["box_id"];
        let shippingID = bd["shipping_id"];
        let final = bd["final"];
        let descr = bd["description"];
        
        //must have order ----------
        if (!orderID) {
            throw new Error("DB05");
        }

        let resOrd = await db.getOrder(orderID, res.locals.groupkey);
        if (resOrd.rows.length == 0) throw new Error("DB08");        

        //shipping type and description from order -------------
        if (!shippingID) shippingID = resOrd.rows[0]["shipping_id"];
        if (!descr) descr = resOrd.rows[0]["content"];
        
        //final shipment in the order?
        if (!final) {final = false} else {final = true};

        //pickupbox
        if (shippingID == 2 && !boxID) {
            throw new Error("DB10"); //must have box ID if shipping type is set to pickup-box
        }
        else if (shippingID != 2) {
            boxID = null;
        }              

        let pickupCode = getPicupCode();

        //contact db ---------------
        let result = await db.addShipment(orderID, boxID, pickupCode, shippingID, final, descr, res.locals.groupkey);
        if (result.rows.length == 0) throw new Error("DB02");
        
        if (shippingID == 2) {
            let shipId = result.rows[0]["id"];
            let resPck = await db.setPickupboxStatus(boxID, shipId, "closed", res.locals.groupkey);
            if (resPck.rows.length == 0) throw new Error("Can't set pickup-box status");
        }         
        
        delete result.rows[0].groupkey;
        res.status(200).json({ msg: "insert shipment ok", record: result.rows[0] }).end();        
    }
    catch (err) {
        next(err);
    }
});

// GET - list shipments --------------------------
router.get("/shipments", secure_group, secure_user, async function (req, res, next) {

    try {

        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        let order_id = req.query["order_id"];
        let order_num = req.query["order_number"];

        let result;

        if (order_id) {
            result = await db.getOrderShipments(order_id, res.locals.groupkey);
        } else if (order_num) {
            result = await db.getOrderNumShipments(order_num, res.locals.groupkey);
        }
        else {
            result = await db.getAllShipments(res.locals.groupkey);

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

// DELETE - delete shipment ---------------------------------
router.delete("/shipments", secure_group, secure_user, async function (req, res, next) {

    try {

        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        let shipId = req.query["shipment_id"];

        // we must have the id ------
        if (!shipId) {
            throw new Error("DB05");
        }

        let result = await db.deleteShipment(shipId, res.locals.groupkey);

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "delete shipment ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});

// PUT - collect shipments -------------------------------
router.put("/shipments", secure_group, async function (req, res, next) {

    try {

        const time = new Date().toISOString();

        let pickupCode = req.query["pickup_code"];
        if (!pickupCode) throw new Error("DB05");

        let result;
        result = await db.checkShipPickup(pickupCode, res.locals.groupkey);
        if (result.rows.length == 0) throw new Error("AUTH06");

        let shipId = result.rows[0]["id"];
        let ship_type = result.rows[0]["shipping_id"];
        let order_id = result.rows[0]["order_id"];        
        let final = result.rows[0]["final"];        

        if (ship_type == "2") { //pickup-box
            const box_id = result.rows[0]["box_id"];
            let resPck = await db.setPickupboxStatus(box_id, shipId, "open", res.locals.groupkey);
            if (resPck.rows.length == 0) throw new Error("Can't set pickup-box status");
        }
        else {            
            result = await db.setShipCollected(shipId, time, res.locals.groupkey); //complete shipment
            if (result.rows.length == 0) throw new Error("Can't set the shipment to collected");

            //check if this is the final shipment
            if (final) {
                let resOrd = await db.completeOrder(order_id, time, res.locals.groupkey); //complete order
                if (resOrd.rows.length == 0) throw new Error("Can't complete the order");
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

// POST - add pickupbox ---------------------------------
router.post("/pickupbox", secure_group, secure_user, async function (req, res, next) {

    try {
        //not administrator? --------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        //reached limit?
		let boxes = await db.getPickupboxes(res.locals.groupkey);
		if (boxes.rows.length >= cfg.DB_RECORD_LIMIT) throw new Error("DB03");

        let boxName = req.query["box_name"];

        //must have box name --------
        if (!boxName) {
            throw new Error("DB05");
        }

        let token = createBoxToken(boxName);

        //contact db ---------------
        let result = await db.addPickupboxes(boxName, token, res.locals.groupkey);

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "insert pickup-box ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB02");
        }
    }
    catch (err) {
        next(err);
    }
});

// GET - list pickupboxes --------------------------
router.get("/pickupbox", secure_group, secure_user, async function (req, res, next) {

    try {

        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        let result = await db.getPickupboxes(res.locals.groupkey);

        for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }

        res.status(200).json(result.rows).end();
    }
    catch (err) {
        next(err);
    }
});

// DELETE - delete picupboxes ---------------------------------
router.delete("/pickupbox", secure_group, secure_user, async function (req, res, next) {

    try {

        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        let boxId = req.query["box_id"];

        // we must have the id ------
        if (!boxId) {
            throw new Error("DB05");
        }

        let result = await db.deletePickupboxes(boxId, res.locals.groupkey);

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "delete pickupbox ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});

// PUT - change picupbox status (open/closed) ---------------
router.put("/pickupbox", secure_group, secure_user, async function (req, res, next) {

    try {

        //not administrator? -------
        if (res.locals.superuser == false) {
            throw new Error("AUTH04");
        }

        let boxId = req.query["box_id"];
        let status = req.query["status"];

        // we must have the id and status ------
        if (!boxId || !status) {
            throw new Error("DB05");
        }

        if (!/^(open|closed)$/i.test(status)) {
            throw new Error("DB04");
        }

        status = status.toLowerCase();

        let result = await db.setPickupboxStatusTest(boxId, status, res.locals.groupkey);

        if (result.rows.length > 0) {
            delete result.rows[0].groupkey;
            res.status(200).json({ msg: "ok, status is set", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});

// GET - check status of a pickupbox --------------------------
router.get("/pickupbox/status", secure_group, async function (req, res, next) {

    try {

        let token = req.query["token"];        
        if (!token) throw new Error("AUTH02");
        let boxName = checkBoxToken(token);

        let result = await db.getPickupboxByName(boxName, res.locals.groupkey);
        
        if (result.rows.length == 0) throw new Error("Can't find pickupbox with that name");
        let statusText = result.rows[0]["status"];
        
        if (!/^(open|closed)$/i.test(statusText)) {
            statusText = "closed";
        }      

        res.status(200).send(statusText).end();
    }
    catch (err) {
        next(err);
    }
});

// GET - confirm that the pickupbox was opened -----------------
router.get("/pickupbox/confirm", secure_group, async function (req, res, next) {

    try {

        const time = new Date().toISOString();

        let token = req.query["token"];        
        if (!token) throw new Error("AUTH02");
        let boxName = checkBoxToken(token);      

        //get shipID and order ID
        let result = await db.getPickupboxByName(boxName, res.locals.groupkey);        
        if (result.rows.length == 0) throw new Error("Can't find pickupbox with that name");
        let shipId = result.rows[0]["shipments_id"];
        let boxId = result.rows[0]["id"];     
        
        result = await db.getShipment(shipId, res.locals.groupkey);
        if (result.rows.length == 0) throw new Error("DB08");
        let order_id = result.rows[0]["order_id"];
        let final = result.rows[0]["final"];

        result = await db.setShipCollected(shipId, time, res.locals.groupkey); //complete shipment
        if (result.rows.length == 0) throw new Error("DB01"); 

        //check if final shipment
        if (final) {
            result = await db.completeOrder(order_id, time, res.locals.groupkey); //complete order
            if (result.rows.length == 0) throw new Error("Can't complete order");
        }        

        result = await db.setPickupboxStatus(boxId, null, "closed", res.locals.groupkey); //set to closed
        if (result.rows.length == 0) throw new Error("Can't set box status");              

        res.status(200).send("ok").end();
    }
    catch (err) {
        next(err);
    }
});


//---------------------------------------------------
function getPicupCode() {

    let code_length = 6;
    const txt = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    let code = "";
    for (let i = 0; i < code_length; i++) {
        code += txt.at(Math.floor(Math.random() * txt.length));
    }

    return code;
}

//---------------------------------------------------
function checkBoxToken(token) {              

    let payload = verifyToken(token);                           

    if (!payload) {
        throw new Error("AUTH02");
    }        

    return payload.data.box_name;  
}

// --------------------------------------------------
module.exports = router;