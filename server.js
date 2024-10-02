const express = require('express');
const fs = require('fs');
const path = require('path');

const server = express();

const onCloud = process.env.ON_RENDER_CLOUD;

let mount = `C:\data`;

if (onCloud) {
    mount = "/var/data";
}

console.log();

// Serve static files from the 'public' directory under the '/static' route
server.use("/static",express.static(mount));

//--------------------------------------------------------------
function createTextFile(filename, content) {
  const filePath = path.join(mount, filename);
  
  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) {
      console.error('An error occurred while writing the file:', err);
    } else {
      console.log('File has been successfully created:', filePath);
    }
  });
}

//---------------------------------------------------------------
server.get('/', (req, res) => {
    try {
        createTextFile("billy.txt", "Hi there 2!");
        res.send('Created file! ' + onCloud);
    } catch (error) {
        res.send('Something went wrong! ' + onCloud);
    }    
});

// starting the server ------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});