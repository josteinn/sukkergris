
//TODO: change name from 'chocolate' to 'product' in DB and code

// setup connection -------------------------
const pg = require('pg');
const cfg = require('./config.js');

let db = {};

const pool = new pg.Pool({
    connectionString: cfg.DB_CRED,
    ssl: { rejectUnauthorized: false }
});

db.pool = pool; //ref. for closing pool at exit


// chocolates -----------------------------------------------------
db.getProductsInGroup = function (groupkey) { 
    let sql = `SELECT id FROM chocolates WHERE groupkey = $1`; //only used to check num of rows (LIMIT)
    let val = [groupkey];          
    return pool.query(sql, val); //return the promise	
}
db.getAllProducts = function (search, groupkey) {       
    let sql = `SELECT chocolateview.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview
    LEFT JOIN ratingview ON chocolateview.id = ratingview.chocolate_id
    WHERE (groupkey = $1 OR static = true) AND UPPER(name) LIKE UPPER($2)
    ORDER BY name`;
    let val = [groupkey, `%${search}%`];
    return pool.query(sql, val); //return the promise    	
}
db.getAllPublicProducts = function (search, groupkey) {    
    let sql = `SELECT chocolateview.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview
    LEFT JOIN ratingview ON chocolateview.id = ratingview.chocolate_id
    WHERE (groupkey = $1 OR static = true) AND UPPER(name) LIKE UPPER($2) AND reserved_members = false
    ORDER BY name`;
    let val = [groupkey, `%${search}%`];    	
    return pool.query(sql, val); //return the promise 
}
db.getAllProductsInCategory = function (search, groupkey, category) {     
    let sql = `SELECT chocolateview.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview
    LEFT JOIN ratingview ON chocolateview.id = ratingview.chocolate_id
    WHERE (groupkey = $1 OR static = true) AND UPPER(name) LIKE UPPER($2) AND category_id = $3
    ORDER BY name`;
    let val = [groupkey, `%${search}%`, category];
    return pool.query(sql, val); //return the promise    	
}
db.getAllPublicProductsInCategory = function (search, groupkey, category) {    
    let sql = `SELECT chocolateview.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview
    LEFT JOIN ratingview ON chocolateview.id = ratingview.chocolate_id
    WHERE (groupkey = $1 OR static = true) AND UPPER(name) LIKE UPPER($2) AND category_id = $3 AND reserved_members = false
    ORDER BY name`;
    let val = [groupkey, `%${search}%`, category];
    return pool.query(sql, val); //return the promise       	
}
db.getProduct = function (id, groupkey) {     
    let sql = `SELECT chocolateview_single.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview_single
    LEFT JOIN ratingview ON chocolateview_single.id = ratingview.chocolate_id
    WHERE id = $1 AND (groupkey = $2 OR static = true)`;
    let val = [id, groupkey];
    return pool.query(sql, val); //return the promise    	
}
db.getPublicProduct = function (id, groupkey) {     
    let sql = `SELECT chocolateview_single.*, ratingview.rating, ratingview.number_of_ratings FROM chocolateview_single
    LEFT JOIN ratingview ON chocolateview_single.id = ratingview.chocolate_id
    WHERE id = $1 AND (groupkey = $2 OR static = true) AND reserved_members = false`;
    let val = [id, groupkey];
    return pool.query(sql, val); //return the promise    	
}
db.addProduct = function(fd) {
    let columns = [
        'name', 'category_id', 'description', 'price', 'discount', 'carbohydrates', 'fat', 'protein', 'energy', 'stock',
        'expected_shipped', 'reserved_members', 'image', 'thumb', 'extra_1', 'extra_2', 'extra_3', 'extra_4', 'heading', 'product_num', 'groupkey'
    ];

    let values = [
        fd.name, fd.category, fd.descr, fd.price, fd.discount, fd.carbs, fd.fat, fd.protein, fd.energy, fd.stock,
        fd.expShip, fd.resMemb, fd.image, fd.thumb, fd.extr1, fd.extr2, fd.extr3, fd.extr4, fd.heading, fd.prodNum, fd.groupkey
    ];

    let { sql, filteredValues } = generateInsertSQL('chocolates', columns, values); //helper function at the end of this file

    return pool.query(sql, filteredValues); // return the promise
}
db.updateProduct = function(fd) {
    let sql = `UPDATE chocolates SET name = $1, category_id = $2, description = $3, price = $4, discount = $5, carbohydrates = $6, fat = $7, protein = $8,
               energy = $9, stock = $10, expected_shipped = $11, reserved_members = $12, image = $13, thumb = $14, extra_1 = $15, extra_2 = $16,
               extra_3 = $17, extra_4 = $18, heading = $19 WHERE id = $20 AND groupkey = $21 RETURNING *`;
    let values = [
        fd.name, fd.category, fd.descr, fd.price, fd.discount, fd.carbs, fd.fat, fd.protein, fd.energy, fd.stock, fd.expShip, fd.resMemb,
        fd.image, fd.thumb, fd.extr1, fd.extr2, fd.extr3, fd.extr4, fd.heading, fd.id, fd.groupkey
    ];

    return pool.query(sql, values); //return the promise    
}

db.deleteProduct = function(id, groupkey) {
    let sql = "DELETE FROM chocolates WHERE id = $1 AND groupkey = $2 AND static = false RETURNING *";
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise    
}

// orders -----------------------------------------------------
db.addOrder = function(fd) {
    let sql = "INSERT INTO orders (customer_name, street, city, zipcode, country, shipping_id, content, groupkey, user_id, ordernumber) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *";
    let val = [fd.name, fd.street, fd.city, fd.zip, fd.country, fd.shipId, fd.content, fd.groupkey, fd.userId, fd.orderNumber];
    return pool.query(sql, val); //return the promise
}
db.getAllOrders = function (groupkey) {
    let sql = `SELECT * FROM orders WHERE groupkey = $1 ORDER BY date`;
    let val = [groupkey];          
    return pool.query(sql, val); //return the promise	
}
db.getOrder = function (id, groupkey) {
    let sql = `SELECT * FROM orders WHERE id = $1 AND groupkey = $2 ORDER BY date`;
    let val = [id, groupkey];          
    return pool.query(sql, val); //return the promise	
}
db.getMemberOrders = function (userid, groupkey) {
    let sql = `SELECT * FROM orders WHERE user_id = $1 AND groupkey = $2 ORDER BY date`;
    let val = [userid, groupkey];          
    return pool.query(sql, val); //return the promise	
}
db.deleteOrder = function (id, groupkey) {
    let sql = `DELETE FROM orders WHERE id = $1 AND groupkey = $2 RETURNING *`;
    let val = [id, groupkey];       
    return pool.query(sql, val); //return the promise	
}
db.completeOrder = function (id, time, groupkey) {
    let sql = "UPDATE orders SET completed = true, completed_date = $1 WHERE id = $2 AND groupkey = $3 RETURNING *";
    let val = [time, id, groupkey];       
    return pool.query(sql, val); //return the promise	
}

// users -----------------------------------------------------
db.getAdminUser = function(username) {
    let sql = "SELECT * from users WHERE username = $1 AND superuser = true";
    let val = [username];   
    return pool.query(sql, val); //return the promise    
}
db.getUserByName = function(username, groupkey) {
    let sql = "SELECT * from users WHERE username = $1 AND groupkey = $2 AND superuser = false"; //for internal login check
    let val = [username, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getUserById = function(id, groupkey) {
    let sql = `SELECT users.*, beenzview.beenz FROM users
    LEFT JOIN beenzview ON users.id = beenzview.user_id
    WHERE id = $1 AND groupkey = $2 AND superuser = false`;
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getAllUsers = function(groupkey) {
    let sql = `SELECT users.*, beenzview.beenz FROM users
    LEFT JOIN beenzview ON users.id = beenzview.user_id
    WHERE groupkey = $1 AND superuser = false ORDER BY username`;
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.addUser = function(username, hash, salt, full_name, street, city, zip, country, thumb, groupkey) {
    let sql = "INSERT INTO users (username, pswhash, salt, full_name, street, city, zipcode, country, thumb, groupkey) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *";
    let val = [username, hash, salt, full_name, street, city, zip, country, thumb, groupkey];
    return pool.query(sql, val); //return the promise
}

db.updateUser = function(fd) {    
    let sql = "UPDATE users SET username = $1, pswhash = $2, salt = $3, full_name = $4, street = $5, city = $6, zipcode = $7, country = $8, thumb = $9 WHERE id = $10 AND groupkey = $11 AND superuser = false RETURNING *";
    let val = [fd.name, fd.hash, fd.salt, fd.fullname, fd.street, fd.city, fd.zip, fd.country, fd.thumb, fd.userid, fd.groupkey];
    return pool.query(sql, val); //return the promise
}
db.deleteUser = function (id, groupkey) {
    let sql = `DELETE FROM users WHERE id = $1 AND groupkey = $2 AND superuser = false RETURNING *`;
    let val = [id, groupkey];       
    return pool.query(sql, val); //return the promise	
}

// comments -----------------------------------------------------
db.getAllComments = function(groupkey) {
    let sql = "SELECT * FROM comments WHERE groupkey = $1 ORDER BY product_id, date"; 
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getAllCommentsByProduct = function(product_id, groupkey) {
    let sql = "SELECT * FROM comments WHERE product_id = $1 AND groupkey = $2 ORDER BY date"; 
    let val = [product_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getAllCommentsByUser = function(userid, groupkey) {
    let sql = "SELECT * FROM comments WHERE user_id = $1 AND groupkey = $2 ORDER BY date"; 
    let val = [userid, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getCommentByUserAndProduct = function(userid, product_id, groupkey) {
    let sql = "SELECT * FROM comments WHERE user_id = $1 AND product_id = $2 AND groupkey = $3 ORDER BY date"; 
    let val = [userid, product_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.addComment = function(comment_text, rating, product_id, user_id, groupkey) {
    let sql = "INSERT INTO comments (comment_text, rating, product_id, user_id, groupkey) VALUES ($1, $2, $3, $4, $5) RETURNING *"; 
    let val = [comment_text, rating, product_id, user_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.updateComment = function(comment_text, rating, product_id, user_id, comment_id, groupkey) {
    let sql = "UPDATE comments SET comment_text = $1, rating = $2, product_id = $3, user_id = $4 WHERE id = $5 AND groupkey = $6 RETURNING *";
    let val = [comment_text, rating, product_id, user_id, comment_id, groupkey];   
    return pool.query(sql, val); //return the promise 
}
db.deleteComment = function(id, groupkey) {
    let sql = "DELETE FROM comments WHERE id = $1 AND groupkey = $2 RETURNING *"; 
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.deleteUserComment = function(id, user_id, groupkey) {
    let sql = "DELETE FROM comments WHERE id = $1 AND user_id = $2 AND groupkey = $3 RETURNING *"; 
    let val = [id, user_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}

// categories -------------------------------------------------
db.getCategories = function() {
    let sql = "SELECT * FROM categories ORDER BY id";      
    return pool.query(sql); //return the promise    
}

// shipping -------------------------------------------------
db.getShipping = function() {
    let sql = "SELECT * FROM shipping ORDER BY id";      
    return pool.query(sql); //return the promise    
}

// messages -------------------------------------------------
db.getMessageById = function(id, groupkey) {
    let sql = "SELECT * FROM messages WHERE id = $1 AND groupkey = $2"; 
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getMessagesInThread = function(thread, groupkey) {
    let sql = "SELECT * FROM messages WHERE thread = $1 AND groupkey = $2 ORDER BY start_of_thread DESC, date ASC"; 
    let val = [thread, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getAllMessagesDesc = function(groupkey) {
    let sql = "SELECT * FROM messages WHERE groupkey = $1 ORDER BY thread DESC, date DESC"; 
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getAllMessagesAsc = function(groupkey) {
    let sql = "SELECT * FROM messages WHERE groupkey = $1 ORDER BY thread ASC, date ASC"; 
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getUserMessages = function(userid, groupkey) {
    let sql = "SELECT * FROM messages WHERE user_id = $1 AND groupkey = $2 ORDER BY date"; 
    let val = [userid, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.deleteMessage = function(id, groupkey) {
    let sql = "DELETE FROM messages WHERE id = $1 AND groupkey = $2 RETURNING *"; 
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.deleteThread = function(thread, groupkey) {
    let sql = "DELETE FROM messages WHERE thread = $1 AND groupkey = $2 RETURNING *"; 
    let val = [thread, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.addMessageNewThread = function(heading, message_text, user_id, groupkey) {
    let sql = "INSERT INTO messages (heading, message, user_id, groupkey) VALUES ($1, $2, $3, $4) RETURNING *"; 
    let val = [heading, message_text, user_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.addMessageOldThread = function(heading, message_text, thread, user_id, groupkey) {
    let sql = "INSERT INTO messages (heading, message, thread, start_of_thread, user_id, groupkey) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"; 
    let val = [heading, message_text, thread, false, user_id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.checkMessageThread = function (thread, groupkey) {
    let sql = "SELECT * FROM messages WHERE thread = $1 AND groupkey = $2"; 
    let val = [thread, groupkey];   
    return pool.query(sql, val); //return the promise 
}

// MeuwMeuwBeenz --------------------------------------------
db.getAllBeenz = function(groupkey) {
    let sql = "SELECT * FROM mbeenz WHERE groupkey = $1";
    let val = [groupkey];
    return pool.query(sql, val); //return the promise
}
db.getBeenzByUser = function(judge, userid, groupkey) {
    let sql = "SELECT * FROM mbeenz WHERE judge = $1 AND user_id = $2 AND groupkey = $3";
    let val = [judge, userid, groupkey];
    return pool.query(sql, val); //return the promise
}
db.addBeenz = function(userid, totalBeenz, influence, judge, groupkey) {
    let sql = "INSERT INTO mbeenz (user_id, wbeenz, influence, judge, groupkey) VALUES ($1, $2, $3, $4, $5) RETURNING *"; 
    let val = [userid, totalBeenz, influence, judge, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.updateBeenz = function(totalBeenz, influence, id, groupkey) {
    let sql = "UPDATE mbeenz SET wbeenz = $1, influence = $2 WHERE id = $3 AND groupkey = $4 RETURNING *"; 
    let val = [totalBeenz, influence, id, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.deleteBeenz = function(judge, groupkey) {
    let sql = "DELETE FROM mbeenz WHERE judge = $1 AND groupkey = $2 RETURNING *"; 
    let val = [judge, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.deleteAllBeenz = function(groupkey) {
    let sql = "DELETE FROM mbeenz WHERE groupkey = $1 RETURNING *"; 
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise    
}

// logistics ------------------------------------------------
db.addShipment = function(order_id, box_id, pickup_code, shipping_id, final, descr, groupkey) {
    let sql = "INSERT INTO shipments (order_id, box_id, pickup_code, shipping_id, final, description, groupkey) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"; 
    let val = [order_id, box_id, pickup_code, shipping_id, final, descr, groupkey];   
    return pool.query(sql, val); //return the promise    
}
db.getOrderShipments = function(order_id, groupkey) {
    let sql = "SELECT * from shipments WHERE order_id = $1 AND groupkey = $2 ORDER BY shipped_date";
    let val = [order_id, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getOrderNumShipments = function(order_num, groupkey) {
    let sql = `SELECT shipments.* FROM shipments INNER JOIN orders ON shipments.order_id = orders.id
    WHERE orders.ordernumber = $1 AND shipments.groupkey = $2`;
    let val = [order_num, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getAllShipments = function(groupkey) {    
    let sql = "SELECT * from shipments WHERE groupkey = $1 ORDER BY shipped_date";
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getShipment = function(shipId, groupkey) {
    let sql = "SELECT * from shipments WHERE id = $1 AND groupkey = $2";
    let val = [shipId, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.deleteShipment = function(ship_id, groupkey) {
    let sql = "DELETE FROM shipments WHERE id = $1 AND groupkey = $2 RETURNING *"; 
    let val = [ship_id, groupkey];   
    return pool.query(sql, val); //return the promise   
}
db.checkShipPickup = function(pickupCode, groupkey) {
    let sql = "SELECT * from shipments WHERE pickup_code = $1 AND groupkey = $2";
    let val = [pickupCode, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.setShipCollected = function(ship_id, time, groupkey) {
    let sql = "UPDATE shipments SET collected = true, collect_date = $1 WHERE id = $2 AND groupkey = $3 RETURNING *"; 
    let val = [time, ship_id, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.addPickupboxes = function(box_name, token, groupkey) {
    let sql = "INSERT INTO pickupboxes (name, token, groupkey) VALUES ($1, $2, $3) RETURNING *"; 
    let val = [box_name, token, groupkey];   
    return pool.query(sql, val); //return the promise     
}
db.getPickupboxes = function(groupkey) {
    let sql = "SELECT * from pickupboxes WHERE groupkey = $1";
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getPickupboxByName = function(name, groupkey) {
    let sql = "SELECT * from pickupboxes WHERE name = $1 AND groupkey = $2";
    let val = [name, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.deletePickupboxes = function(box_id, groupkey) {
    let sql = "DELETE FROM pickupboxes WHERE id = $1 AND groupkey = $2 RETURNING *"; 
    let val = [box_id, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.setPickupboxStatus = function(box_id, ship_id, status, groupkey) {
    let sql = "UPDATE pickupboxes SET shipments_id = $1, status = $2 WHERE id = $3 AND groupkey = $4 RETURNING *"; 
    let val = [ship_id, status, box_id, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.setPickupboxStatusTest = function(box_id, status, groupkey) {
    let sql = "UPDATE pickupboxes SET status = $1 WHERE id = $2 AND groupkey = $3 RETURNING *"; 
    let val = [status, box_id, groupkey];   
    return pool.query(sql, val); //return the promise
}

// logging --------------------------------------------------
db.updateGroupLog = function(groupkey) {    
    let sql = `INSERT INTO grouplog (groupkey) VALUES ($1) ON CONFLICT ON CONSTRAINT unique_group_date DO UPDATE SET daycount = grouplog.daycount + 1`;
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise 
}

db.getLog = function() {
    let sql = `SELECT groupkey, SUM (daycount) AS total FROM grouplog GROUP BY groupkey`;    
    return pool.query(sql); //return the promise
}

// test products ---------------------------------------------
db.getDummyProductsById = function(id, groupkey) {
    let sql = "SELECT * from dummies WHERE id = $1 AND groupkey = $2";
    let val = [id, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getDummyProductsByCategory = function(category, groupkey) {
    let sql = "SELECT * from dummies WHERE category = $1 AND groupkey = $2";
    let val = [category, groupkey];   
    return pool.query(sql, val); //return the promise
}
db.getAllDummyProducts = function(groupkey) {
    let sql = "SELECT * from dummies WHERE groupkey = $1";
    let val = [groupkey];   
    return pool.query(sql, val); //return the promise
}
db.addDummyProduct = function(fd) {
    let sql = "INSERT INTO dummies (name, description, category, details, thumb, price, groupkey) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"; 
    let val = [fd.name, fd.description, fd.category, fd.details, fd.thumb, fd.price, fd.groupkey];   
    return pool.query(sql, val); //return the promise     
}
db.updateDummyProduct = function(fd) {    
    let sql = "UPDATE dummies SET name = $1, description = $2, category = $3, details = $4, thumb = $5, price = $6 WHERE id = $7 AND groupkey = $8 RETURNING *";
    let val = [fd.name, fd.description, fd.category, fd.details, fd.thumb, fd.price, fd.id, fd.groupkey];
    return pool.query(sql, val); //return the promise
}
db.deleteDummyProduct = function(dummy_id, groupkey) {
    let sql = "DELETE FROM dummies WHERE id = $1 AND groupkey = $2 RETURNING *"; 
    let val = [dummy_id, groupkey];   
    return pool.query(sql, val); //return the promise
}


//helper functions -------------------------------------------
function generateInsertSQL(table, columns, values) {
    let sqlColumns = columns.join(', ');
    let placeholders = [];
    let filteredValues = [];

    values.forEach((value, index) => {
        if (value === null) {
            placeholders.push('DEFAULT');
        } else {
            placeholders.push(`$${filteredValues.length + 1}`);
            filteredValues.push(value);
        }
    });

    let sqlValues = placeholders.join(', ');

    let sql = `INSERT INTO ${table} (${sqlColumns}) VALUES (${sqlValues}) RETURNING *`;

    return { sql, filteredValues };
}


// export dbMethods ------------------------------------------
module.exports = db;