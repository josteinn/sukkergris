const express = require('express');

const server = express();

server.get('/', (req, res) => {
    res.send('Hello World!');
});

// starting the server ------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});