const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    title: String,
    czarUserId: String,
    code: String,
    selectedCaptions: [ 
        {
        caption: String,
        ownerFirebaseId: String
        }
    ],
    users: [
        {
            _id: String,
            username: String,
            cards: [String]
        }
    ],
    roomCards: [String]
});

module.exports = mongoose.model('Game', GameSchema);