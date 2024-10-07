
const express = require("express");
const multer = require('multer');
const authUtils = require('./utils.js');
const jimp = require('jimp');

const router = express.Router();
const mem = multer.memoryStorage();
const upload = multer({ storage: mem, limits: { fileSize: 1000000, fieldSize: 500, fields: 100, files: 1, headerPairs: 100 } }); //save to buffer


// Retrieve text-data in query -----------------------------------------
router.get("/ex_query/person", (req, res, next) => {

	//retrieve data
	let name = req.query["name"];
	let age = req.query["age"];

	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}

	let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
	//send the response to the client
	res.status(200).send(outputTxt.trim()).end();
});

// Retrieve text-data in route -----------------------------------------
router.get("/ex_params/person/:name/:age", (req, res, next) => {

	//retrieve data
	let name = req.params["name"];
	let age = req.params["age"];

	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}
	
	let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
	//send the response to the client
	res.status(200).send(outputTxt).end();
});

// Retrieve text-data in header ----------------------------------------
router.get("/ex_headers/person", (req, res, next) => {

	//retrieve data from the client in header
	let name = req.headers["name"];
	let age = req.headers["age"];

	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}
	
	let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
	//send the response to the client
	res.status(200).send(outputTxt).end();
});

// Retrieve text-data (JSON) in body -----------------------------------
router.post("/ex_body/person", (req, res, next) => {

	///retrieve data
	let name = req.body["name"];
	let age = req.body["age"];

	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}
	
	let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
	//send the response to the client
	res.status(200).send(outputTxt).end();
});

// Retrieve text-data (multipart/formdata) in body -------------------------
router.post("/ex_formdata/person", upload.none(), (req, res, next) => {

	//retrieve data
	let name = req.body["name"];
	let age = req.body["age"];
	
	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}
	
	let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
	//send the response to the client
	res.status(200).send(outputTxt).end();
});

// Retrieve a file (multipart/formdata) in body -------------------------
router.post("/ex_file/person", upload.single("theFile"), async (req, res, next) => {

	//retrieve data
	let name = req.body["name"];
	let age = req.body["age"];

	if (!name || !age) {
		res.statusMessage = "Need name and age!";
		res.status(400).send("Need name and age!").end();
		return;
	}

	try {        
		
        if (!req.file?.buffer) {
            res.status(400).send("Need an image file").end();
		    return;
        }
        
        let jimpImg = await jimp.read(req.file.buffer);        

		jimpImg.greyscale();
		jimpImg.resize(100, 100);			
		imageData = await jimpImg.getBase64Async("image/png"); //image as Base64
		let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
	
		//send the response to the client
		res.status(200).json({msg:outputTxt, img: imageData}).end();		
	}
	catch(err) {
		res.statusMessage = err;		
		res.status(500).send(err).end();
	}
	
});

// Retrieve data and a file (base64) in body ---------------------------
router.post("/ex_file_base64/person", async (req, res, next) => {

	//retrieve data
	let name = req.body["name"];
	let age = req.body["age"];
	let img = req.body["image"];

    if (!name || !age || !img) {
		res.statusMessage = "Need name, age and an image!";
		res.status(400).send("Need name, age and an image!").end();
		return;
	}

	try {
		img = img.replace(/^data:image.+;base64,/, "");
		let imgBuffer = Buffer.from(img, "base64");
	
	
		let jimpImg = await jimp.read(imgBuffer);
		jimpImg.greyscale();
		jimpImg.resize(100, 100);	
		let imageData = await jimpImg.getBase64Async("image/png"); //image as Base64
		let outputTxt = `Hi there! The server got the info about ${name}. Note that ${name} spelled backwards is "${getBackwards(name)}". ${getAgeTxt(name, age)}`;
		
		//send the response to the client
		res.status(200).json({msg:outputTxt, img: imageData}).end();
	}

	catch(err) {
		res.statusMessage = err;		
		res.status(500).send(err).end();
	}
});

// Retrieve a file (raw) in body ---------------------------------------
router.post("/ex_file_binary/person", async (req, res, next) => {

	//retrieve data from the client in the body
	let imgBuffer = req.body;	

	try {

        if (!imgBuffer) {
            res.status(400).send("Need an image file").end();
		    return;
        }

		let jimpImg = await jimp.read(imgBuffer);

        if (!jimpImg) {
            res.status(400).send("Need an image file").end();
		    return;
        }

		jimpImg.greyscale();
		jimpImg.resize(100, 100);		
		let imageData = await jimpImg.getBase64Async("image/png"); //image as Base64			

		//send the response to the client
		res.status(200).json({msg:"The upload was ok", img: imageData}).end();
	}
	catch(err) {
		res.statusMessage = err;		
		res.status(500).send(err).end();
	}	

});

// user login -----------------------------
router.post("/ex_auth/login", async function(req, res, next) {
	
    let credString = req.headers.authorization;

	if (!credString) {
		res.status(401).json({error: "No authentication header"}).end();
        return;
	}

    let cred = authUtils.decodeCred(credString);

	if (!cred) {
		res.status(401).json({error: "No authentication header"}).end();
        return;
	}
    
    if (cred.username == "" || cred.password == "") {
        res.status(401).json({error: "No username or password"}).end();
        return;
    }        
        
		const db = {
			username: "sukkergris",
			password: "troika"
		}

		if (cred.username != db.username) {
			res.status(403).json({error: "Wrong username"}).end();
			return;
		}

		if (cred.password != db.password) {
			res.status(403).json({error: "Wrong password"}).end();
			return;
		}		

		//create and send the token
		let tok = authUtils.createToken("1", db.username, false);
		
		res.status(200).json({
			msg: "The login was successful!",
			token: tok
		}).end();				
	
});

// Retrieve a list of users ----------------------------------------
router.get("/ex_auth/userlist", (req, res, next) => {

	let token = req.headers.authorization;	

	if (!token) {
        res.status(401).json({error: "No token"}).end();
        return;
    }	

	let payload = authUtils.verifyToken(token);
    if (!payload) {
        res.status(403).json({error: "Not a valid token"}).end();
        return;
    }

	const userlist = [

		{username: "sukkergris", id: 1},
		{username: "Robby Newby", id: 2},
		{username: "Billy Strut", id: 3},
		{username: "Curly Mavies", id: 4},

	];		
	
	//send the response to the client
	res.status(200).json(userlist).end();
});

//---------------------------------------------------------------
function getBackwards(name) {
	const reversedName = name.split('').reverse().join('');
	return reversedName;
}

//---------------------------------------------------------------
function getAgeTxt(name, age) {
	if (age < 18) {
		return `Also, ${name} is not allowed to drink beer. He/her is only ${age} years old.`;
	}
	else {
		return `Also, ${name} is a big boy/girl that can drink beer. He/her is ${age} years old.`;
	}
}

// --------------------------------------------------
module.exports = router;






