const { createClient } = require("redis");

const client = createClient({
    host: 'localhost',
    port: 6379, 
});
client.connect();

module.exports = client