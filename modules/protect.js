
const cfg = require('./config.js');
const db = require('./db.js');
const xss = require('xss');
const { verifyToken } = require('./utils');

exports.secure_user = function (req, res, next) {

    try {
        let token = req.headers.authorization;

        if (!token) {
            throw new Error("AUTH02");
        }

        let payload = verifyToken(token);

        if (!payload) {
            throw new Error("AUTH02");
        }

        res.locals.userid = payload.data.userid;
        res.locals.username = payload.data.username;
        res.locals.superuser = payload.data.superuser;

        next();
    }
    catch (err) {
        next(err);
    }
}

exports.get_cred = function (req, res, next) {

    try {
        let token = req.headers.authorization;

        if (!token) {
            next();
            return;
        }

        if (token.trim() == "") {
            next();
            return;
        }

        let payload = verifyToken(token);

        if (!payload) {
            throw new Error("AUTH02");
        }

        res.locals.userid = payload.data.userid;
        res.locals.username = payload.data.username;
        res.locals.superuser = payload.data.superuser;

        next();
    }
    catch (err) {
        next(err);
    }

}

exports.secure_group = async function (req, res, next) {

    try {

        //check for content-type        
        if (req.headers["content-type"]) {
            //not handled by multer or bodyparser?
            if (req.headers["content-type"].search(/multipart\/form-data/i) == -1 && req.headers["content-type"].search(/application\/json/i) == -1) {
                throw new Error("SRV01");
            }
        }

        //check group
        const groupkeys = cfg.groupkeys;

        if (groupkeys.indexOf(req.query["key"]) != -1) {
            res.locals.groupkey = req.query["key"];

            //update log ============ TURN ON AFTER PROJECT START ==============                     
            await db.updateGroupLog(res.locals.groupkey);

            next();
        }
        else {
            throw new Error("AUTH01");
        }
    }
    catch (err) {
        next(err);
    }
}


exports.sanitizeInput = function (req, res, next) {

    // Sanitize all input data in req.body 
    if (req.body) {
        for (let key in req.body) {            

            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }

            if (req.body.hasOwnProperty(key)) {                
                req.body[key] = xss(req.body[key]);                
            }
        }
    }

    // Sanitize all input data in req.query
    if (req.query) {
        for (let key in req.query) {

            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }

            if (req.query.hasOwnProperty(key)) {
                req.query[key] = xss(req.query[key]);
            }
        }
    }

    // Sanitize all input data in req.params
    if (req.params) {
        for (let key in req.params) {

            if (typeof req.params[key] === 'string') {
                req.params[key] = req.params[key].trim();
            }

            if (req.params.hasOwnProperty(key)) {
                req.params[key] = xss(req.params[key]);
            }
        }
    }

    // Sanitize all input data in req.headers
    if (req.headers) {
        for (let key in req.headers) {

            if (typeof req.headers[key] === 'string') {
                req.headers[key] = req.headers[key].trim();
            }

            if (req.headers.hasOwnProperty(key)) {
                req.headers[key] = xss(req.headers[key]);
            }
        }
    }

    next();
}

exports.sanitizeFormData = function (req, res, next) {

    // Sanitize all input data in req.body from formdata
    if (req.body) {
        for (let key in req.body) {            

            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
                req.body[key] = xss(req.body[key]);
            }
            
        }
    }

    next();
} 





