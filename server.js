const express = require('express');

const server = express();

const envTest = process.env.ON_RENDER_CLOUD;

server.get('/', (req, res) => {
    res.send('Hello World! ' + envTest);
});

// starting the server ------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});