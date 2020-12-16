const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    title: String,
    rooms: [
        {
            code: String,
            czarFirebaseId: String,
            selectedCaptions: [ 
                {
                caption: String,
                ownerFirebaseId: String
                }
            ],
            users: [
                {
                    userFirebaseId: String,
                    userName: String,
                    cards: [
                        {caption: String}
                    ]
                }
            ]
        }
    ]
});

module.exports = mongoose.model('Game', GameSchema);