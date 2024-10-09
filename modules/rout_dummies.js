const express = require('express');
const multer = require('multer');
const db = require('./db.js');
const fileUtils = require('./fileutils.js');
const cfg = require('./config.js');
const router = express.Router();
const { secure_group, sanitizeInput, sanitizeFormData } = require('./protect.js');
const fs = require('fs').promises;
const path = require('path');
const mem = multer.memoryStorage();
const upload = multer({ storage: mem, limits: { fileSize: 1000000, fieldSize: 500, fields: 100, files: 1, headerPairs: 100 } }); //save to buffer

// GET - get categories ---------------------------------
router.get("/categories", secure_group, async function (req, res, next) {

    try {
        let result = await db.getCategories();

        for (let row of result.rows) {
            delete row.groupkey; //delete "confidential data"
        }
        
        res.status(200).json(result.rows).end();        

    }
    catch (err) {
        next(err);
    }

});

// GET - test products ------------------------------
router.get("/products", secure_group, sanitizeInput, async function (req, res, next) {

    try {

        let result;

        if (req.query["category_id"]) {            
            result = await db.getDummyProductsByCategory(req.query["category_id"], res.locals.groupkey);
        }
        else if (!req.query["id"]) {
            result = await db.getDummyProductById(req.query["id"], res.locals.groupkey);
        }
        else {
            result = await db.getAllDummyProducts(res.locals.groupkey);
        }

        //remove confidensial data to be sent back
        for (let row of result.rows) {            
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
router.post("/products", secure_group, upload.single("thumb"), sanitizeFormData, async function (req, res, next) {

    try {

        let bd = req.body;        

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //must have product name 
        let productName = bd["name"];

        if (!productName) {
            throw new Error("DB05");
        }

        //reached limit?
        let products = await db.getAllDummyProducts(res.locals.groupkey);
        if (products.rows.length >= cfg.DB_RECORD_LIMIT) {
            throw new Error("DB03");
        }

        //image handling
        const filename = await fileUtils.imageHandlerDummy(req.file, res.locals.groupkey);

        //create data obj
        const fields = {
            name: productName,
            description: bd.description || "",
            category_id: bd.category_id || "1",
            details: bd.details || "",
            thumb: filename,
            price: bd.price || 0,
            groupkey: res.locals.groupkey
        }

        let result = await db.addDummyProduct(fields);

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
router.put("/products", secure_group, upload.single("thumb"), sanitizeFormData, async function (req, res, next) {

    try {

        let bd = req.body;
        let result;

        //wrong content-type?
        if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
            throw new Error("SRV01");
        }

        //we must have the id
        const id = bd["id"];
        if (!id) {
            throw new Error("DB05");
        }

        //retrieve existing data
        result = await db.getDummyProductById(id, res.locals.groupkey);

        if (result.rows.length < 1) {
            throw new Error("DB01");
        }

        //image handling
        let filename;
        if (req.file) {
            //add new image
            filename = await fileUtils.imageHandlerDummy(req.file, res.locals.groupkey);

            //delete old image
            await fileUtils.deleteFileDummy(result.rows[0].thumb, res.locals.groupkey);
        }

        //create data obj
        const fields = {
            id,
            name: bd.product_name || result.rows[0].name,
            description: bd.description || result.rows[0].description,
            category_id: bd.category_id || result.rows[0].category_id,
            details: bd.details || result.rows[0].details,
            thumb: filename || result.rows[0].thumb,
            price: bd.price || result.rows[0].price,
            groupkey: res.locals.groupkey
        }

        result = await db.updateDummyProduct(fields);

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
router.delete("/products", secure_group, sanitizeInput, async function (req, res, next) {

    try {
        
        //we must have the id
        if (!req.query["id"]) {
            throw new Error("DB05");
        }

        let result = await db.deleteDummyProduct(id, res.locals.groupkey);

        if (result.rows.length > 0) {

            //remove confidensial data to be sent back        
            delete result.rows[0].groupkey;
            delete result.rows[0].static;

            //delete the image
            await fileUtils.deleteFileDummy(result.rows[0].thumb);

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


// GET - files ------------------------------
/*
router.get("/files", secure_group, async function (req, res, next) {

    try {

        //mounting the folder ---------------------
        let mount = "C:\\data";
        if (process.env.ON_RENDER_CLOUD) {
            mount = "/var/data";
        }

        // List all files in the folder recursively
        const files = await listFilesRecursively(mount);

        res.status(200).json(files).end();
    }
    catch (err) {
        next(err);
    }
});




// Helper function to list files recursively
async function listFilesRecursively(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });

    for (const file of list) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(await listFilesRecursively(filePath));
        } else {
            results.push(filePath);
        }
    }

    return results;
}

*/

// --------------------------------------------------
module.exports = router;



