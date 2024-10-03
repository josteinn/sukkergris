// Cleanup -------------------------------------------

const db = require('./db.js');

const cleanup = {};
cleanup.handler = function(cleanupHandler) {
    
  // do app specific cleaning before exiting
  process.on('exit', function () {    
    //cleanup
    db.pool.end(() => {
      console.log('pool has ended');
    })    
    
    cleanupHandler({code:0, msg: "Normal exit...", descr: ""});
  });
  
  // catch ctrl+c event and exit normally
  process.on('SIGINT', function () {        
    cleanupHandler({code:2, msg: "Ctrl-C...", descr: ""});
    process.exit(2);    
  });

  //catch uncaught exceptions, trace, then exit normally
  process.on('uncaughtException', function(e) {        
    cleanupHandler({code:99, msg: "Uncaught Exception...", descr: e});
    process.exit(99);
  });  

}

// --------------------------------------------------
module.exports = cleanup;