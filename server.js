const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const products = require("./modules/rout_products.js");
const users = require("./modules/rout_users.js");
const orders = require("./modules/rout_orders.js");
const comments = require("./modules/rout_comments.js");
const categories = require("./modules/rout_categories.js");
const shiptypes = require("./modules/rout_shipping.js");
const messages = require("./modules/rout_messages.js");
const beenz = require("./modules/rout_beenz.js");

const logistics = require("./modules/rout_logistics.js");
const log = require("./modules/rout_logging.js");
const test = require("./modules/rout_test.js");
const cleanup = require("./modules/cleanup.js");
const favicon = require('express-favicon');
const errorhandler = require("./modules/errorhandler.js");
const { sanitizeInput } = require('./modules/protect.js');

const server = express();
server.set('trust proxy', 1); // for rate limiter

// rate limiter ------------------------------------
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 300, // max 300 requests per IP per 10 minutes
	standardHeaders: true,
	legacyHeaders: false,
})

// middleware --------------------------------------
server.use(limiter);
server.use(cors());
server.use(express.json({limit:'10kb'}));
server.use(favicon('fvicon.png'));
server.use(sanitizeInput);

// routing -----------------------------------------
server.use("/webshop/products", products);
server.use("/users", users);
server.use("/webshop/orders", orders);
server.use("/webshop/comments", comments);
server.use("/webshop/categories", categories);
server.use("/logistics/shippingtypes", shiptypes);
server.use("/logistics", logistics);
server.use("/msgboard/messages", messages);
server.use("/msgboard/beenz", beenz);
//server.use("/public", express.static("tst_client"));

server.use("/log", log);
server.use("/webshop/testproducts", test);

//route for image files ----------------------------
let mount = "C:\\data";
if (process.env.ON_RENDER_CLOUD) {
	mount = "/var/data";
}
server.use("/images", express.static(mount));

// If none above - send 404 error ------------------
server.use((req, res, next) => {
	throw new Error("SRV04");
});

//general error handling ---------------------------
server.use(errorhandler);

// start server ------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// on exit -----------------------------------------
process.stdin.resume();//so the program will not close instantly
cleanup.handler(function(exit){
	console.log(exit.code, exit.msg, exit.descr);
});

