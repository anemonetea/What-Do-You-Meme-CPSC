module.exports = (app) => {
    const game = require('../controllers/game.controller');

    app.post('/game', game.createRoom);

    app.get('/game', game.getAllRooms);

    app.get('/game/:roomId', game.getRoom);

    app.post('/game/:roomId/users', game.addUserToRoom);

    app.patch('/game/:roomId/czarUser', game.rotateCzarUser);

    app.patch('/game/:roomId/imageUrl', game.updateImage);

    app.post('/game/:roomId/:czarUserId/selectedCaptions', game.addSelectedCaptionToRoom);

    app.delete('/game/:roomId/:czarUserId/selectedCaptions', game.clearSelectedCaptionsInRoom);

    app.patch('/game/:roomId/:czarUserId/score', game.scoreSelectedCaption);

    app.post('/game/:roomId/users/:userId/caption', game.addCaptionCardToUser);

    app.post('/game/:roomId/users/:userId/captions', game.addFiveCaptionCardsToUser);

    app.delete('/game/:roomId/users/:userId', game.deleteUserFromRoom);

    app.delete('/game/:roomId', game.deleteRoom);
}