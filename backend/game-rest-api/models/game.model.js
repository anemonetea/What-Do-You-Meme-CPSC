const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

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
            score: Number,
            cards: [String]
        }
    ],
    roomCards: [String]
});

module.exports = mongoose.model('Game', GameSchema);