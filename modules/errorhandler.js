//error objects -----------------------------------
const NO_GROUP_KEY = {
    msg: "Groupkey is missing or not valid",
    code: "AUTH01",
    http_code: 401
};
const NO_TOKEN = {
    msg: "Token is missing, expired or not valid",
    code: "AUTH02",
    http_code: 401
};
const INVALID_AUTH = {
    msg: "Wrong username or password",
    code: "AUTH03",
    http_code: 403
};
const NO_SUPERUSER = {
    msg: "No access - you must be logged in as administrator",
    code: "AUTH04",
    http_code: 403
};
const NO_USER = {
    msg: "No access - you must be logged in as a user (not administrator)",
    code: "AUTH05",
    http_code: 403
};
const NO_PICKUP = {
    msg: "No access - wrong pickup-code",
    code: "AUTH06",
    http_code: 403
};
const BAD_FILE_TYPE = {
    msg: "Wrong filetype",
    code: "FILE01",
    http_code: 415
};
const FILE_TOO_LARGE = {
    msg: "The file is too large",
    code: "FILE02",
    http_code: 413
};
const FILE_MISSING  = {
    msg: "File missing",
    code: "FILE03",
    http_code: 400
};
const NO_MATCHING_REC = {
    msg: "No matching record in the database",
    code: "DB01",
    http_code: 400
};
const INSERT_FAILED = {
    msg: "Couldn't insert row in the database",
    code: "DB02",
    http_code: 400
};
const REACHED_RECORD_LIMIT = {
    msg: "Too many records - couldn't insert row. Delete some records to continue...",
    code: "DB03",
    http_code: 500
};
const BAD_INPUT = {
    msg: "Missing or bad input",
    code: "DB04",
    http_code: 400
};
const ID_MISSING = {
    msg: "Reqired data missing, e.g., a name, password or ID for an item",
    code: "DB05",
    http_code: 400
};
const NOT_UNIQUE = {
    msg: "Only one record is allowed with the same name or ID (must be unique)",
    code: "DB06",
    http_code: 400
};
const WRONG_ID = {
    msg: "Wrong ID - the supplied ID can't be used with the current credentials",
    code: "DB07",
    http_code: 400
};
const WRONG_REF = {
    msg: "Wrong reference - you are trying to reference data, or an ID, that doesn't exist.",
    code: "DB08",
    http_code: 400
};
const NO_SHIP_TYPE = {
    msg: "Can't find shipping method.",
    code: "DB09",
    http_code: 400
};
const NO_BOX_ID = {
    msg: "Must have pickup-box ID when shipping method is set to pickup-box",
    code: "DB10",
    http_code: 400
};
const NO_BOX_NAME = {
    msg: "Can't find a pickupbox with the specified name/token",
    code: "DB11",
    http_code: 400
};
const WRONG_CONTENT_TYPE = {
    msg: "Missing or wrong 'content-type' in headers - or the content in body is of wrong type",
    code: "SRV01",
    http_code: 400
};
const BAD_JSON = {
    msg: "The content (body) couldn't be interpreted as valid JSON",
    code: "SRV02",
    http_code: 400
};
const MISSING_CONTENT_TYPE = {
    msg: "The content (body) doesn't match any content-type in the header",
    code: "SRV03",
    http_code: 400
};

const ENDPOINT_NOT_FOUND = {
    msg: "The endpoint was not found on this server. Check your URL and/or the HTTP verb (get, post, put or delete)",
    code: "SRV04",
    http_code: 404
};

//errorHandler -------------------------------------
function errorHandler (err, req, res, next) {

    msg = err.message;
    //console.log(msg); //************* fjernes ved publish ************* */   

	if (msg.search("AUTH01") != -1) {
        res.statusMessage = NO_GROUP_KEY.msg;
		res.status(NO_GROUP_KEY.http_code).json(NO_GROUP_KEY).end();
	}
    else if (msg.search("AUTH02") != -1) {
        res.statusMessage = NO_TOKEN.msg;
        res.status(NO_TOKEN.http_code).json(NO_TOKEN).end();
    }
    else if (msg.search("AUTH03") != -1) {
        res.statusMessage = INVALID_AUTH.msg;
        res.status(INVALID_AUTH.http_code).json(INVALID_AUTH).end();
    }
    else if (msg.search("AUTH04") != -1) {
        res.statusMessage = NO_SUPERUSER.msg;
        res.status(NO_SUPERUSER.http_code).json(NO_SUPERUSER).end();
    }
    else if (msg.search("AUTH05") != -1) {
        res.statusMessage = NO_USER.msg;
        res.status(NO_USER.http_code).json(NO_USER).end();
    }
    else if (msg.search("AUTH06") != -1) {
        res.statusMessage = NO_PICKUP.msg;
        res.status(NO_PICKUP.http_code).json(NO_PICKUP).end();
    }
    else if (msg.search("find MIME") != -1) {
        res.statusMessage = BAD_FILE_TYPE.msg;
        res.status(BAD_FILE_TYPE.http_code).json(BAD_FILE_TYPE).end();
    }
    else if (msg.search("File too large") != -1) {
        res.statusMessage = FILE_TOO_LARGE.msg;
        res.status(FILE_TOO_LARGE.http_code).json(FILE_TOO_LARGE).end();
    }
    else if (msg.search("FILE03") != -1) {
        res.statusMessage = FILE_MISSING.msg;
        res.status(FILE_MISSING.http_code).json(FILE_MISSING).end();
    }
    else if (msg.search("DB01") != -1) {
        res.statusMessage = NO_MATCHING_REC.msg;
        res.status(NO_MATCHING_REC.http_code).json(NO_MATCHING_REC).end();
    }
    else if (msg.search("DB02") != -1) {
        res.statusMessage = INSERT_FAILED.msg;
        res.status(INSERT_FAILED.http_code).json(INSERT_FAILED).end();
    }
    else if (msg.search("DB03") != -1) {
        res.statusMessage = REACHED_RECORD_LIMIT.msg;
        res.status(REACHED_RECORD_LIMIT.http_code).json(REACHED_RECORD_LIMIT).end();
    }    
    else if (msg.search("invalid input syntax") != -1) {
        res.statusMessage = BAD_INPUT.msg;
        res.status(BAD_INPUT.http_code).json(BAD_INPUT).end();
    }
    else if (msg.search("foreign key constraint") != -1) {
        res.statusMessage = WRONG_REF.msg;
        res.status(WRONG_REF.http_code).json(WRONG_REF).end();
    }      
    else if (msg.search("DB04") != -1) {
        res.statusMessage = BAD_INPUT.msg;
        res.status(BAD_INPUT.http_code).json(BAD_INPUT).end();
    }        
    else if (msg.search("DB05") != -1 || msg.search("null value in column") != -1 ) {
        res.statusMessage = ID_MISSING.msg;
        res.status(ID_MISSING.http_code).json(ID_MISSING).end();
    }
    else if (msg.search("duplicate key value") != -1) {
        res.statusMessage = NOT_UNIQUE.msg;
        res.status(NOT_UNIQUE.http_code).json(NOT_UNIQUE).end();
    }
    else if (msg.search("DB07") != -1) {
        res.statusMessage = WRONG_ID.msg;
        res.status(WRONG_ID.http_code).json(WRONG_ID).end();
    }
    else if (msg.search("DB08") != -1) {
        res.statusMessage =  WRONG_REF.msg;
        res.status( WRONG_REF.http_code).json( WRONG_REF).end();
    }
    else if (msg.search("DB09") != -1) {
        res.statusMessage = NO_SHIP_TYPE.msg;
        res.status(NO_SHIP_TYPE.http_code).json(NO_SHIP_TYPE).end();
    }
    else if (msg.search("DB10") != -1) {
        res.statusMessage = NO_BOX_ID.msg;
        res.status(NO_BOX_ID.http_code).json(NO_BOX_ID).end();
    }
    else if (msg.search("DB11") != -1) {
        res.statusMessage = NO_BOX_NAME.msg;
        res.status(NO_BOX_NAME.http_code).json(NO_BOX_NAME).end();
    }    
    else if (msg.search("in JSON at position") != -1) {
        res.statusMessage = BAD_JSON.msg;
        res.status(BAD_JSON.http_code).json(BAD_JSON).end();
    }
    else if (msg.search("SRV01") != -1) {
        res.statusMessage = WRONG_CONTENT_TYPE.msg;
        res.status(WRONG_CONTENT_TYPE.http_code).json(WRONG_CONTENT_TYPE).end();
    }
    else if (msg.search("SRV03") != -1) {
        res.statusMessage = MISSING_CONTENT_TYPE.msg;
        res.status(MISSING_CONTENT_TYPE.http_code).json(MISSING_CONTENT_TYPE).end();
    }
    else if (msg.search("SRV04") != -1) {
        res.statusMessage = ENDPOINT_NOT_FOUND.msg;
        res.status(ENDPOINT_NOT_FOUND.http_code).json(ENDPOINT_NOT_FOUND).end();
    }  
    
	else {
        console.log(err.message, err.stack);

        res.statusMessage = err.message;

		res.status(500).json({
			msg: "Oops! Something went bad on the server! Contact the almighty creator of this server (Jostein), if the error persists.",
            code: "SRV00",
            http_code: 500
		}).end();
	}	
}

module.exports = errorHandler;