const mongoose = require('mongoose');

const RoomCzarSchema = mongoose.Schema({
    roomId: String,
    czarUserId: String,
    czarToken: String
});

module.exports = mongoose.model('RoomCzar', RoomCzarSchema);
