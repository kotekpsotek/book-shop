const { Schema } = require("mongoose");

const review = new Schema({
    rating: { type: Number, default: 5.0 },
    author: { type: String, required: true },
    date: { type: Date, default: () => new Date() }
})

const book = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true },
    reviews: { type: [], default: [] }
});

module.exports = {
    defualt: book,
    review
};
