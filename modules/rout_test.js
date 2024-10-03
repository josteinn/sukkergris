const express = require('express');
const multer = require('multer');
const db = require('./db.js');
const fileUtils = require('./fileutils.js');
const cfg = require('./config');
const router = express.Router();
const { secure_group } = require('./protect');

const mem = multer.memoryStorage();
const upload = multer({ storage: mem, limits: { fileSize: 1000000, fieldSize: 500, fields: 100, files: 1, headerPairs: 100 } }); //save to buffer

// GET - test products ------------------------------
router.get("/", secure_group, async function (req, res, next) {

    try {

        let result;

        if (!req.query["category_id"] || req.query["category_id"].trim() == "") {
            result = await db.getAllTestProducts(res.locals.groupkey);
        }
        else {
            result = await db.getTestProductsByCategory(req.query["category_id"], res.locals.groupkey);
        }

        //remove confidensial data to be sent back
        for (let row of result.rows) {
            delete row.pswhash;
            delete row.salt;
            delete row.groupkey;
            delete row.static;
        }

        res.status(200).json(result.rows).end();
    }
    catch (err) {
        next(err);
    }
});


// POST - add test products -----------------------------
router.post("/", secure_group, upload.single("img_file"), async function (req, res, next) {

    try {

        let bd = req.body;
        trimObjectStrings(bd);

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //must have product name 
        let productName = bd["product_name"];

        if (!productName) {
            throw new Error("DB05");
        }

        //reached limit?
        let products = await db.getAllTestProducts(res.locals.groupkey);
        if (products.rows.length >= cfg.DB_RECORD_LIMIT) {
            throw new Error("DB03");
        }

        //image handling
        const filename = await fileUtils.imageHandlerProduct(req.file, res.locals.groupkey);

        //create data obj
        const fields = {
            name: productName,
            description: bd.description || "",
            category: bd.category || "1",
            details: bd.details || "",
            image: filename,
            price: bd.price || 0,
            groupkey: res.locals.groupkey
        }

        let result = await db.addTestProduct(fields);

        if (result.rows.length > 0) {            

            //remove confidensial data to be sent back        
            delete result.rows[0].groupkey;
            delete result.rows[0].static;
            res.status(200).json({ msg: "Insert product ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB02");
        }
    }
    catch (err) {
        next(err);
    }
})


// PUT - update test product -----------------------------
router.put("/", secure_group, upload.single("img_file"), async function (req, res, next) {

    try {

        let bd = req.body;
        let result;

        trimObjectStrings(bd);

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //we must have the id
        const id = bd["product_id"];
        if (!id) {
            throw new Error("DB05");
        }

        //retrieve existing data
        result = await db.getTestProductsById(id, res.locals.groupkey);

        if (result.rows.length < 1) {
            throw new Error("DB01");
        }

        //image handling
        let filename;
        if (req.file) {
            //add new image
            filename = await fileUtils.imageHandlerProduct(req.file, res.locals.groupkey);

            //delete old image
            await fileUtils.deleteFileProduct(result.rows[0].img, res.locals.groupkey);
        }

        //create data obj
        const fields = {
            id,
            name: bd.product_name || result.rows[0].name,
            description: bd.description || result.rows[0].description,
            category: bd.category || result.rows[0].category,
            details: bd.details || result.rows[0].details,
            image: filename || result.rows[0].img,
            price: bd.price || result.rows[0].price,
            groupkey: res.locals.groupkey
        }

        result = await db.updateTestProduct(fields);

        if (result.rows.length > 0) {            

            //remove confidensial data to be sent back        
            delete result.rows[0].groupkey;
            delete result.rows[0].static;
            res.status(200).json({ msg: "Update product ok", record: result.rows[0] }).end();
        }
        else {
            throw new Error("DB01");
        }
    }
    catch (err) {
        next(err);
    }
});


// DELETE - delete test product -----------------------------
router.delete("/", secure_group, async function (req, res, next) {

    try {

        trimObjectStrings(req.query);
        
        //we must have the id
        if (!req.query["product_id"]) {
            throw new Error("DB05");
        }

        let result = await db.deleteTestProduct(id, res.locals.groupkey);

        if (result.rows.length > 0) {

            //remove confidensial data to be sent back        
            delete result.rows[0].groupkey;
            delete result.rows[0].static;

            //delete the image
            await fileUtils.deleteFileProduct(result.rows[0].img);

            res.status(200).json({ msg: "Delete product ok", record: result.rows[0] }).end();
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