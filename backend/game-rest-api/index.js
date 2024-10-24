const express = require('express');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

require('./routes/game.routes')(app);


// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

connectDb();

// Connecting to the database
async function connectDb() {
    try {
        await mongoose.connect(dbConfig.url, dbConfig.clientOptions);
        console.log("Successfully connected to the database");
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Successfully pinged database deployment.");
    }
    catch (err) {
        console.log('Could not connect to the database. Exiting now...', err);
        await mongoose.disconnect();
        process.exit();
    }
}

app.get('/', (req, res) => {
    console.log("Hello");
    return res.send('Welcome to the What Do You Meme CPSC RESTful API');
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`),
);