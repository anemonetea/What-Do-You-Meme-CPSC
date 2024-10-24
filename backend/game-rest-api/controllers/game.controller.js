const GameModel = require('../models/game.model');
const fetch = require('node-fetch');

class UserNotFoundError extends Error {
    constructor(userId = "", ...args) {
        const message = `Cannot find user with id ${userId} in the game room.`;
        super(message, ...args);
    }
}

class UserExistsError extends Error {
    constructor(userId = "", ...args) {
        const message = `User with userId=${userId} already exists in the room.`;
        super(message, ...args);
    }
}

class InvalidTypeError extends Error {
    constructor(param = "", type = "", ...args) {
        const message = `Invalid param (${param}) of type ${type}`;
        super(message, ...args);
    }
}

exports.createRoom = async (req, res) => {

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

    const img = await fetchImageUrl();
    if (img == null) {
        return res.status(500).json({
            message: "Some error occurred while fetching the new meme image url."
        });
    }
    if (!img.includes("http")) {
        if (img.includes("Some error")) {
            return res.status(500).json({
                message: img
            });
        }
        return res.status(400).json({
            message: img
        });
    }

    const users = [{
        _id: req.body.czarId,
        username: req.body.czarUsername,
        score: 0,
        cards: []
    }];

    const game = new GameModel({
        title: "What Do You Meme CPSC",
        czarUserId: req.body.czarId,
        code: code,
        imageUrl: img,
        selectedCaptions: [],
        users: users,
        roomCards: [...DEFAULT_CAPTIONS]
    });

    game.save()
    .then( data => res.json(data))
    .catch( err => {
        console.error(err);
        res.status(500).json({
            message: err.message || "Some error occurred while creating the Lobby."
        });
    });

}

exports.getAllRooms = (req, res) => {
    GameModel.find()
    .then(rooms => {
        res.json(rooms);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({
            message: "Some error occurred while retreiving game data."
        });
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
        console.error(err);
        return res.status(500).json({
            message: "Error retrieving room with id " + req.params.roomId + "."
        });
    });
}

exports.addUserToRoom = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.body) {
        return res.status(400).json({
            message: "Request body cannot be empty!"
        });
    }

    if (!req.body.userId) {
        return res.status(400).json({
            message: "userId body JSON element cannot be empty!"
        });
    }

    if (!req.body.username) {
        return res.status(400).json({
            message: "username body JSON element cannot be empty!"
        });
    }

    try {
        const room = await GameModel.findOne({'_id': req.params.roomId});
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId}.`
            });
        }

        validateUserDoesNotExist(room, req.body.userId);

        const cards = pullFiveRandomCaptions(room.roomCards);
        room.markModified("roomCards");
        room.users.push({
            _id: req.body.userId,
            username: req.body.username,
            score: 0,
            cards: cards
        });
        const updatedGame = await room.save();
        return res.json(updatedGame);
    } catch (err) {
        console.error(err);
        if (err instanceof UserExistsError || err instanceof InvalidTypeError) {
            return res.status(500).json({
                message: err.message
            });
        }
        return res.status(500).json({
            message: "Error while adding the user to the room."
        });
    }
}

exports.rotateCzarUser = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    try {
        const room = await GameModel.findById(req.params.roomId);
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId}.`
            });
        }
        const newCzarUserId = findNewCzarUserId(room.users, room.czarUserId);
        room.czarUserId = newCzarUserId;
        const updatedRoom = room.save();
        return res.json(updatedRoom);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error while updating the czarUserId of the room."
        });
    }
}

exports.updateImage = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }
    
    const img = await fetchImageUrl();
    if (img == null) {
        return res.status(500).json({
            message: "Some error occurred while fetching the new meme image url."
        });
    }
    if (!img.includes("http")) {
        if (img.includes("Some error")) {
            return res.status(500).json({
                message: img
            });
        }
        return res.status(400).json({
            message: img
        });
    }
    
    GameModel.findOneAndUpdate({'_id': req.params.roomId}, {$set: {imageUrl: img}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: `Unable to find room with roomId=${req.params.roomId}.`
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while updating the meme image url of the room."
            });
        }
    });

}

exports.addSelectedCaptionToRoom = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.czarUserId) {
        return res.status(400).json({
            message: "czarUserId url param cannot be empty!"
        });
    }

    if (!req.body) {
        return res.status(400).json({
            message: "Request body cannot be empty!"
        });
    }

    if (!req.body.userId) {
        return res.status(400).json({
            message: "userId body JSON element cannot be empty!"
        });
    }

    if (!req.body.selectedCaption) {
        return res.status(400).json({
            message: "selectedCaption body JSON element cannot be empty!"
        });
    }

    if (req.params.czarUserId == req.body.userId) {
        return res.status(400).json({
            message: "Czar user cannot select their own cards."
        });
    }

    try {
        // Find the card to be selected in the user's deck (a selected card needs to exist)
        const room = await GameModel.findOne({'_id': req.params.roomId, "users._id": req.body.userId, "czarUserId": req.params.czarUserId, 'users.cards': req.body.selectedCaption});
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room for roomId=${req.params.roomId}, czarUserId=${req.params.czarUserId}, with a member user userId=${req.body.userId}.`
            });
        }

        // Validate that the card's owner user has the card.
        const currentUser = findUserByUserId(room, req.body.userId);
        const foundCard = currentUser.cards.find(caption => caption == req.body.selectedCaption);
        if (!foundCard) {
            return res.status(400).json({
                message: `Card "${req.body.selectedCaption}" not found for user with userId=${req.body.userId}.`
            })
        }
        
        // Update the room's selected card
        room.selectedCaptions.push({
            caption: req.body.selectedCaption,
            ownerFirebaseId: req.body.userId
        });
        // Remove selected card from the user's deck
        currentUser.cards = currentUser.cards.filter(caption => caption !== req.body.selectedCaption);
        const updatedRoom = await room.save();
        return res.json(updatedRoom);
    } catch (err) {
        console.error(err);
        if (err instanceof UserNotFoundError || err instanceof InvalidTypeError) {
            return res.status(500).json({
                message: err.message
            });
        }
        return res.status(500).json({
            message: "Error while adding the selected caption card to the room."
        });
    }
}

exports.clearSelectedCaptionsInRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.czarUserId) {
        return res.status(400).json({
            message: "czarUserId url param cannot be empty!"
        });
    }
    
    GameModel.findOneAndUpdate({'_id': req.params.roomId, "czarUserId": req.params.czarUserId}, {$set: {'selectedCaptions': []}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: `Unable to find the room for roomId=${req.params.roomId} and czarUserId=${req.params.czarUserId}.`
            });
        }
        return res.json(room);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({
            message: "Error while clearing selected caption cards in the room."
        });
    });
}

exports.addCaptionCardToUser = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    try {
        const room = await GameModel.findOne({'_id': req.params.roomId});
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId}.`
            });
        }
        const card = getRandomCaption(room.roomCards);
        room.markModified("roomCards");
        const currentUser = findUserByUserId(room, req.params.userId);
        currentUser.cards.push(card);
        const updatedRoom = await room.save();
        return res.json(updatedRoom);
    } catch (err) {
        console.error(err);
        if (err instanceof UserNotFoundError || err instanceof InvalidTypeError) {
            return res.status(500).json({
                message: err.message
            });
        }
        return res.status(500).json({
            message: "Error while adding caption to user."
        });
    }
}

exports.addFiveCaptionCardsToUser = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    try {
        const room = await GameModel.findOne({'_id': req.params.roomId});
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId}.`
            });
        }
        const cards = pullFiveRandomCaptions(room.roomCards);
        room.markModified("roomCards");
        const currentUser = findUserByUserId(room, req.params.userId);
        currentUser.cards = currentUser.cards.concat(cards);
        const updatedRoom = await room.save();
        return res.json(updatedRoom);
    } catch (err) {
        console.error(err);
        if (err instanceof UserNotFoundError || err instanceof InvalidTypeError) {
            return res.status(500).json({
                message: err.message
            });
        }
        return res.status(500).json({
            message: `Error while adding five cards to user ${req.params.userId}.`
        });
    }
}

/*
exports.incrementScoreOnUser = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    GameModel.findOneAndUpdate({'_id': req.params.roomId, 'users._id': req.params.userId}, {$inc: {"users.$.score": 1}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId} with member userId=${req.params.userId}.`
            });
        }
        return res.json(room);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({
            message: "Error while incrementing user's score in the room."
        });
    });
}
*/

exports.deleteUserFromRoom = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    try {
        const room = await GameModel.findOne({'_id': req.params.roomId, 'users._id': req.params.userId});
        if (!room) {
            return res.status(400).json({
                message: `Cannot find room with roomId=${req.params.roomId}.`
            });
        }
        if (room.czarUserId === req.params.userId) {
            return res.status(400).json({
                message: "Cannot remove the Czar user from an ongoing game."
            });
        }
        // Remove user from users list
        room.users = room.users.filter(user => user._id !== req.params.userId);
        const updatedRoom = await room.save();
        res.json(updatedRoom);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error while deleting the user from the room."
        });
    }
}

exports.deleteRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    GameModel.findOneAndDelete({'_id': req.params.roomId})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: `Unable to find the room with roomId=${req.params.roomId}.`
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while deleting the room."
            });
        }
    });
}

function findUserByUserId(room, userId) {
    let requestingUserId;
    const userIdType = typeof userId;  // JS type string
    if (userIdType === 'number') {
        requestingUserId = req.body.userId.toString();
    } else if (userIdType === 'string') {
        requestingUserId = userId.trim();
    } else {
        throw new InvalidTypeError(userId, userIdType);
    }
    const currentUser = room.users.find(user => user._id === requestingUserId);
    if (!currentUser) {
        throw new UserNotFoundError(userId);
    }
    return currentUser;
}

function validateUserDoesNotExist(room, userId) {
    let requestingUserId;
    const userIdType = typeof userId;  // JS type string
    if (userIdType === 'number') {
        requestingUserId = userId.toString();
    } else if (userIdType === 'string') {
        requestingUserId = userId.trim();
    } else {
        throw new InvalidTypeError(userId, userIdType);
    }
    const existingUser = room.users.find(user => user._id === requestingUserId);
    if (existingUser) {
        throw new UserExistsError(userId);
    }
}

function findNewCzarUserId(users, currentCzarId) {
    let newCzarUserId;
    for (let i=0; i<users.length; i++) {
        if (users[i]._id === currentCzarId) {
            if (i+1 < users.length) {
                newCzarUserId = users[i+1]._id;
            }
            else {
                newCzarUserId = users[0]._id;
            }
            break;
        }
    }
    return newCzarUserId;
}

function generateCode() {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const capitalLetters = letters.map(ltr => ltr.toUpperCase());
    let code = "";
    for (i=0; i<6; i++) {
        let indx = Math.floor(Math.random() * 100 % (letters.length-1));
        if (i % 2 == 0) {
            code += letters[indx];
        }
        else {
            code += capitalLetters[indx];
        }
    }
    return code;
}

async function fetchImageUrl() {
    return await fetch('https://api.imgflip.com/get_memes', {
        method: 'get',
        headers: { 'Accept': 'application/json' },
    })
    .then(async res => {
        if (!res) {
            return "Unable to fetch meme image url."
        }
        let parsedRes = await res.text();
        let memeData = JSON.parse(parsedRes).data.memes;
        var num = Math.floor(Math.random() * (99+1));
        return memeData[num].url;
    })
    .catch(err => {
        if (err) {
            return  err.message
        }
        else {
            return "Some error occurred while fetching a new meme image."
        }
    });
}

function pullFiveRandomCaptions(captions) {
    let myCaptions = [];
    let indexes = [];
    for (let i=0; i<5; i++) {
        let indx = getRandomArrayIndex(captions.length);
        indx = validateReplaceNextIndex(indx, indexes, captions);
        indexes.push(indx);
        myCaptions[i] = captions[indx];
    }
    // Remove selected indexes from captions list
    indexes.forEach(i => delete captions[i]);
    //captions = captions.filter(el => el !== undefined);
    return myCaptions;
}

function getRandomCaption(captions) {
    let indx = getRandomArrayIndex(captions.length);
    indx = validateReplaceNextIndex(indx, [], captions);
    let myCaption = captions[indx];
    delete captions[indx];
    return myCaption;
}

function validateReplaceNextIndex(nextIndex, seenIndexes, values) {
    const randIndx = nextIndex;  // save the index
    while (seenIndexes.find(i => i === nextIndex) || values[nextIndex] == undefined) {
        nextIndex = nextIndex + 1;
        if (nextIndex == values.length) {
            nextIndex = 0;
        }
        if (nextIndex == randIndx) {
            // This will ultimately detect if all values have been used up (are nully).
            break;
        }
    }
    return nextIndex;
}

function getRandomArrayIndex(arrayLength) {
    return Math.floor(Math.random() * 100) % (arrayLength-1);
}

const DEFAULT_CAPTIONS = [
    'When you get fucked in your 449 final.',
    'The Comp Sci Lab.',
    'When you are frustrated with your Base Model Macbook Air.',
    'Building your own PC',
    'Remembering you are in Haskayne.',
    'When your recursion works',
    'recursion > loops',
    'Coding in bitwise operations',
    'Trying to understand what your professor is saying',
    'I am dropping out to start an Only Fans.',
    'Oh you know how to write "Hello World" and you call yourself a programmer?',
    'I enjoy long walks to Math Sciences in my free time.',
    'My back hurts from carrying my team so hard.',
    'Who needs sleep when you have coffee.',
    'Coding for 8 hours straight',
    'Giving up on Git because you have been resolving merge conflicts for 4 hours',
    'Keeeping copies of files as version control',
    'When you write a ton of code in one go and spend 8 hours debugging it',
    'Just because it compiles, doesn\'t mean it works',
    'HTML is a language',
    'When someone brags about their friend knowing HTML',
    "C code",
    "Calculating what you need to get on the final to pass the course",
    'Having a teammate as useless as a chromebook',
    'When you find out there is going to be a peer review.',
    'Merged right to Main and caused an Error.',
    'When you get a merge conflict.',
    'Copying code from stackoverflow',
    'null pointer exception',
    'When you hit compile and it works the first time',
    'When someone merges spaghetti code ',
    'When the project manager wants to use C',
    '3 billion devices run java',
    'Array indexes should start at 1',
    'Counting everything from 0',
    'When your unicard will not scan at math sciences',
    'Linux users',
    'Assembly > Prolog',
    'Academic Misconduct',
    'Closing 12 Stackoverflow tabs after solving the problem',
    'Having 50 tabs open',
    'Coding in EMacs',
    'Preferring Vim over Emacs',
    'Trying to exit Vim',
    'Look at me, I am the scrum master now.',
    'Am I dumb or am I stupid?.',
    'incrementing a loop, x++ versus x -= -1 ',
    'my spaghetti code versus my clean code',
    'git merge --force',
    'writing "Hello World" does not make you a programmer.',
    'Why is my code returning an infinite loop?',
    'Your friends Chegg Account',
    'Fork child, kill parent',
    'Fork children, kill orphans',
    'This task should take you 2 hours.',
    'And that is how you calculate 1+3',
    'Writes 10 lines of code without looking at Google.',
    'You study computer science, can you fix my printer?',
    'I hate LINUX',
    'Voting Linux for best OS',
    'Sorry babe, not tonight, I am coding.',
    'Will my program work if I re-compile?',
    'Will my program work if I restart the computer?',
    'Missing semicolon on line 331',
    'Cannot have any runtime errors if your code does not compile',
    'I hate programming, I hate programming, I love programming! YAY!',
    'Submitting an infinite loop to WebCat',
    'Print Statements are better than a debugger.',
    'The face you make when you get a segmentation fault.',
    'FORK BOMB!',
    'Only friends on social media are parents... gets cyberbullied.',
    'When you try to think recursively.',
    'When you get the same seat you picked in the first class.',
    'Art students.',
    'Needing to do a proof by induction.',
    'When turning it off and on again does not work.',
    'Trying to get that extra percent of test case coverage.',
    'Assignment due date is not until tomorrow night.',
    'Waiting for your program to compile.',
    'When people do not shut up in Zoom chat.',
    'Professor having to go over assignment rules for the fourth time.',
    'Do you need an extension?',
    'When your professor gives a last-minute extension but you already pulled an all-nighter trying to finish the assignment'
];
