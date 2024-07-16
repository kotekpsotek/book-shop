const { Schema } = require("mongoose");
const { v7: uuid } = require("uuid");

const user = new Schema({
    uuid: { type: String, default: () => uuid(), unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, minLength: 8, maxLength: 500 },
    arrivalDate: { type: Date , default: () => new Date() },
})

module.exports = user;
