const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

require('./routes/game.routes')(app);

// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())


// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

app.get('/', (req, res) => {
    console.log("Hello");
    return res.send('Welcome to the What Do You Meme CPSC RESTful API');
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`),
);