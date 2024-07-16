const { Schema } = require("mongoose");
const { v7: uuid } = require("uuid")

const review = new Schema({
    id: { 
        type: String, 
        default: () => uuid(),
        unique: true
    },
    rating: { type: Number, default: 5.0 },
    author: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
    modification_date: { type: Date, optional: true }
})

const book = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true },
    reviews: { type: [review], default: [] }
});

module.exports = {
    defualt: book,
    review
};
