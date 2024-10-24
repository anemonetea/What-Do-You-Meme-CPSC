module.exports = {
    url: process.env.MONGODB_URL,
    clientOptions: { serverApi: { version: '1', strict: true, deprecationErrors: true } }
}