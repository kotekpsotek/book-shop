const mongoose = require("mongoose");
const bookSchema = require("./schema/books");

const con1 = mongoose.createConnection("mongodb://localhost:27017/book-store"); // FIXME: in production environment your database should be protected by password, login etc..
const modelBooks = con1.model("booksModel", bookSchema.defualt, "books"); // 1 Model can be assigned to utmost 1 connection

module.exports = {
    con1,
    modelBooks
}
