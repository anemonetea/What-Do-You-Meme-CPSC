const GameModel = require('../models/game.model');

exports.createRoom = (req, res) => {

    if (!req.body) {
        return res.status(400).json({
            message: "Request body cannot be empty!"
        });
    }

    if (!req.body.czarId) {
        return res.status(400).json({
            message: "czarId body JSON element cannot be empty!"
        });
    }

    if (!req.body.czarUsername) {
        return res.status(400).json({
            message: "czarUsername body JSON element cannot be empty!"
        });
    }

    const code = generateCode(); // generate 6-letter code

    const users = [{
        userFirebaseId: req.body.czarId,
        userName: req.body.czarUsername,
        cards: []
    }];

    const game = new GameModel({
        rooms: [
            {
                code: code,
                czarFirebaseId: req.body.czarId,
                selectedCaptions: [],
                users: users
            }
        ]
    });

    game.save()
        .then( data => res.json(data))
        .catch( err => {
            console.log(err);
            res.status(500).json({
                message: err.message || "Some error occurred while creating the Lobby."
            })
        });

}

exports.getAllRooms = (req, res) => {
    GameModel.find()
        .then(rooms => {
            res.json(rooms);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Some error occurred while retreiving game data."
            })
        });
}

exports.getRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    GameModel.findById(req.params.roomId)
        .then(room => {
            if (!room) {
                return res.status(404).json({
                    message: "Room with id " + req.params.roomId + " not found."
                });
            }
            return res.json(room);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).json({
                    message: "Room with id " + req.params.roomId + " not found."
                });
            }
            console.log(err);
            return res.status(500).json({
                message: "Error retrieving room with id " + req.params.roomId + "."
            });
        });
}

exports.addUserToRoom = (req, res) => {

}

exports.addSelectedCaptionToRoom = (req, res) => {

}

exports.addCaptionCardToUser = (req, res) => {

}

exports.deleteUserFromRoom = (req, res) => {

}

exports.deleteRoom = (req, res) => {

}

function generateCode() {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const capitalLetters = letters.map(ltr => ltr.toUpperCase());
    let code = "";
    for (i=0; i<6; i++) {
        let indx = Math.floor(Math.random() * 100 % 26);
        if (i % 2 == 0) {
            code += letters[indx];
        }
        else {
            code += capitalLetters[indx];
        }
    }
    return code;
}