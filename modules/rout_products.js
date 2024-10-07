// Endpoints /plants --------------------------------
const express = require('express');
const db = require('./db.js');
const multer = require('multer');
const router = express.Router();
const { secure_group, get_cred, secure_user, sanitizeFormData } = require('./protect.js');
const fileUtils = require('./fileutils.js');
const cfg = require('./config.js');
const { createProductNumber } = require("./utils.js");

const mem = multer.memoryStorage();
const upload = multer({ storage: mem, limits: { fileSize: 2000000, fieldSize: 1000, fields: 100, files: 1, headerPairs: 100 } }); //save to buffer

// GET - products -------------------------------------
router.get("/", secure_group, get_cred, async function (req, res, next) {

	try {

		let result;
		let search;

		//not a searchtext?
		if (!req.query["search"]) {
			search = "";
		}

		//is there a logged in user?
		if (res.locals.userid) {

			if (req.query["id"]) {
				result = await db.getProduct(req.query["id"], res.locals.groupkey);
			}
			else if (req.query["category"]) {
				result = await db.getAllProductsInCategory(search, res.locals.groupkey, req.query["category"]);
			}
			else {
				result = await db.getAllProducts(search, res.locals.groupkey);
			}
		}
		else {
			if (req.query["id"]) {
				result = await db.getPublicProduct(req.query["id"], res.locals.groupkey);
			}
			else if (req.query["category"]) {
				result = await db.getAllPublicProductsInCategory(search, res.locals.groupkey, req.query["category"]);
			}
			else {
				result = await db.getAllPublicProducts(search, res.locals.groupkey);
			}
		}

		if (result.rows.length > 1) {
			for (let row of result.rows) {
				delete row.groupkey; //delete "confidential data"
				if (!res.locals.superuser) {
					delete row.extra_3;
					delete row.extra_4;
				}
			}
		}
		else {
			for (let row of result.rows) {
				delete row.groupkey; //delete "confidential data"
				if (!res.locals.superuser) {
					delete row.extra_3;
					delete row.extra_4;
				}
			}
		}

		res.status(200).json(result.rows).end();
	}
	catch (err) {
		next(err);
	}
});

// POST - add products -----------------------------
router.post("/", secure_group, secure_user, upload.single("img_file"), sanitizeFormData, async function (req, res, next) {

	try {

		let bd = req.body;		

		//not administrator?
		if (res.locals.superuser == false) {
			throw new Error("AUTH04");
		}

		//wrong content-type?
		if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
			throw new Error("SRV01");
		}

		//we must have the name
		if (!bd["name"]) {
			throw new Error("DB05");
		}

		//reached limit?
		let result = await db.getProductsInGroup(res.locals.groupkey);
		if (result.rows.length >= cfg.DB_RECORD_LIMIT) {
			throw new Error("DB03");
		}

		//product number based on category
		let productNumber = createProductNumber("CH");

		if (bd["category_id"]) {
			if (bd["category_id"] == "6") {
				productNumber = createProductNumber("WR");
			}
			if (bd["category_id"] == "7") {
				productNumber = createProductNumber("EQ");
			}
		}

		//image handling
		const fileObj = await fileUtils.imageHandlerProduct(req.file, res.locals.groupkey);

		//create data obj
		const fields = {
			name: bd.name,
			category: bd.category_id || null,
			descr: bd.description || null,
			price: bd.price || null,
			discount: bd.discount || null,
			carbs: bd.carbohydrates || null,
			fat: bd.fat || null,
			protein: bd.protein || null,
			energy: bd.energy || null,
			stock: bd.stock || null,
			expShip: bd.expected_shipped || null,
			resMemb: bd.reserved_members || null,
			image: fileObj.image || "",
			thumb: fileObj.thumb || "",
			extr1: bd.extra_1 || null,
			extr2: bd.extra_2 || null,
			extr3: bd.extra_3 || null,
			extr4: bd.extra_4 || null,
			heading: bd.heading || null,
			prodNum: productNumber,
			groupkey: res.locals.groupkey
		}

		result = await db.addProduct(fields);

		if (result.rows.length > 0) {			

			//remove conf data
			delete result.rows[0].groupkey;

			res.status(200).json({ msg: "Insert product ok", record: result.rows[0] }).end();
		}
		else {
			throw new Error("DB02");
		}
	}
	catch (err) {
		next(err);
	}
});

// PUT - update products -----------------------------
router.put("/", secure_group, secure_user, upload.single("img_file"), sanitizeFormData, async function (req, res, next) {

	try {

		let bd = req.body;
		let result;		

		//not administrator?
		if (res.locals.superuser == false) {
			throw new Error("AUTH04");
		}

		//wrong content-type?
		if (req.headers["content-type"].search(/multipart\/form-data/i) == -1) {
			throw new Error("SRV01");
		}

		//we must have the id
		if (!bd["id"]) {
			throw new Error("DB05");
		}

		//retrieve existing data
		result = await db.getProduct(bd.id, res.locals.groupkey);

		if (result.rows.length < 1) {
			throw new Error("DB01");
		}		

		//image handling
		let fileObj;
		if (req.file) {			
			//add new image
			fileObj = await fileUtils.imageHandlerProduct(req.file, res.locals.groupkey);

			//delete old image
			await fileUtils.deleteFileProduct(result.rows[0].image, result.rows[0].thumb, res.locals.groupkey);
		}

		//create data obj
		const fields = {
			id: bd.id,
			name: bd.name || result.rows[0].name,
			category: bd.category_id || result.rows[0].category_id,
			descr: bd.description || result.rows[0].description,
			price: bd.price || result.rows[0].price,
			discount: bd.discount || result.rows[0].discount,
			carbs: bd.carbohydrates || result.rows[0].carbohydrates,
			fat: bd.fat || result.rows[0].fat,
			protein: bd.protein || result.rows[0].protein,
			energy: bd.energy || result.rows[0].energy,
			stock: bd.stock || result.rows[0].stock,
			expShip: bd.expected_shipped || result.rows[0].expected_shipped,
			resMemb: bd.reserved_members || result.rows[0].reserved_members,
			image: fileObj?.image || result.rows[0].image,
			thumb: fileObj?.thumb || result.rows[0].thumb,
			extr1: bd.extra_1 || result.rows[0].extra_1,
			extr2: bd.extra_2 || result.rows[0].extra_2,
			extr3: bd.extra_3 || result.rows[0].extra_3,
			extr4: bd.extra_4 || result.rows[0].extra_4,
			heading: bd.heading || result.rows[0].heading,
			groupkey: res.locals.groupkey
		}

		result = await db.updateProduct(fields);

		if (result.rows.length > 0) {			

			//remove conf. data
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

// DELETE - delete products ----------------------------
router.delete("/", secure_group, secure_user, async function (req, res, next) {

	try {

		//not administrator?
		if (res.locals.superuser == false) {
			throw new Error("AUTH04");
		}		

		//we must have the id
		if (!req.query["id"]) {
			throw new Error("DB05");
		}		

		let result = await db.deleteProduct(req.query["id"], res.locals.groupkey);
		
		if (result.rows.length > 0) {

			//delete the image
            await fileUtils.deleteFileProduct(result.rows[0].image, result.rows[0].thumb, res.locals.groupkey);

			//remove confidensial data to be sent back 
			delete result.rows[0].groupkey;
			delete result.rows[0].static;

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