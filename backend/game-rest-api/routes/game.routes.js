module.exports = (app) => {
    const game = require('../controllers/game.controller');

    app.post('/game', game.createRoom);

    app.get('/game', game.getAllRooms);

    app.get('/game/:roomId', game.getRoom);

    app.post('/game/:roomId/users', game.addUserToRoom);

    app.post('/game/:roomId/selectedCaptions', game.addSelectedCaptionToRoom);

    app.post('/game/:roomId/users/:userId/captions/1', game.addCaptionCardToUser);

    app.post('/game/:roomId/users/:userId/captions', game.addFiveCaptionCardsToUser);

    app.delete('/game/:roomId/users:userId', game.deleteUserFromRoom);

    app.delete('/game:roomId', game.deleteRoom);
}