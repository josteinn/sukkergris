
const jimp = require('jimp');
const utils = require('./utils.js');
const path = require('path');
const fs = require('fs').promises;
const defaultImage = require("./default_image.js").defaultImg;




//----------------------------------------------
exports.imageHandlerProduct = async function (file, groupkey) {

	let mountLarge = `C:\\data\\${groupkey}\\large`;
	let mountSmall = `C:\\data\\${groupkey}\\small`;

	if (process.env.ON_RENDER_CLOUD) {
		mountLarge = `/var/data/${groupkey}/large`;
		mountSmall = `/var/data/${groupkey}/small`;
	}

	try {

		let jimpImg;
		let filenameLarge;
		let filenameSmall;

		if (!file) {
			const base64String = defaultImage.image;
			const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');	
			jimpImg = await jimp.read(Buffer.from(base64Data, 'base64'));
			filenameLarge = utils.generateRandomFilename("default.png", groupkey);
			filenameSmall = utils.generateRandomFilename("default.png", groupkey);		
		}
		else {
			jimpImg = await jimp.read(file.buffer);
			filenameLarge = utils.generateRandomFilename(file.originalname, groupkey);
			filenameSmall = utils.generateRandomFilename(file.originalname, groupkey);
		}
		
		let jimpThm = jimpImg.clone();
		jimpImg.resize(300, 300);
		jimpThm.resize(100, 100);		

		const filepathLarge = path.join(mountLarge, filenameLarge);
		const filepathSmall = path.join(mountSmall, filenameSmall);

		// Save the resized image
		await jimpImg.writeAsync(filepathLarge);
		await jimpThm.writeAsync(filepathSmall);

		return {image:filenameLarge, thumb:filenameSmall};
	}
	catch (err) {
		throw (err);
	}
}

//----------------------------------------------
exports.deleteFileProduct = async function (filenameLarge, filenameSmall, groupkey) {

	let mountLarge = `C:\\data\\${groupkey}\\large`;
	let mountSmall = `C:\\data\\${groupkey}\\small`;

	if (process.env.ON_RENDER_CLOUD) {
		mountLarge = `/var/data/${groupkey}/large`;
		mountSmall = `/var/data/${groupkey}/small`;
	}

	const filepathLarge = path.join(mountLarge, filenameLarge);
	const filepathSmall = path.join(mountSmall, filenameSmall);

	try {
		// Check if the large file exists before unlinking
		try {
			await fs.access(filepathLarge);
			await fs.unlink(filepathLarge);
		} catch (err) {
			if (err.code !== 'ENOENT') {
				throw err; // Rethrow if the error is not 'file not found'
			}
		}

		// Check if the small file exists before unlinking
		try {
			await fs.access(filepathSmall);
			await fs.unlink(filepathSmall);
		} catch (err) {
			if (err.code !== 'ENOENT') {
				throw err; // Rethrow if the error is not 'file not found'
			}
		}
	} catch (err) {
		throw err;
	}
}

//----------------------------------------------
exports.imageHandlerUser = async function (file, groupkey) {

	let mount = `C:\\data\\${groupkey}\\users`;

	if (process.env.ON_RENDER_CLOUD) {
		mount = `/var/data/${groupkey}/users`;
	}

	try {
		
		let jimpImg;
		let filename;

		if (!file) {
			const base64String = defaultImage.image;
			const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');	
			jimpImg = await jimp.read(Buffer.from(base64Data, 'base64'));
			filename = utils.generateRandomFilename("default.png", groupkey);		
		}
		else {
			jimpImg = await jimp.read(file.buffer);
			filename = utils.generateRandomFilename(file.originalname, groupkey);
		}

		jimpImg.resize(100, 100);

		const filepath = path.join(mount, filename);

		// Save the resized image
		await jimpImg.writeAsync(filepath);		

		return filename;
	}
	catch (err) {
		throw (err);
	}
}

//----------------------------------------------
exports.deleteFileUser = async function (filename, groupkey) {

	let mount = `C:\\data\\${groupkey}\\users`;

	if (process.env.ON_RENDER_CLOUD) {
		mount = `/var/data/${groupkey}/users`;
	}

	const filepath = path.join(mount, filename);

	try {
		// Check if the file exists before unlinking
		try {
			await fs.access(filepath);
			await fs.unlink(filepath);
		} catch (err) {
			if (err.code !== 'ENOENT') {
				throw err; // Rethrow if the error is not 'file not found'
			}
		}
		
	} catch (err) {
		throw err;
	}
}
