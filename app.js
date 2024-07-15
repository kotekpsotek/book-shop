const { Response } = require("express"); // types
const express = require("express");
const app = express();

// Load environmental variables to process.env
require("dotenv").config();

// User configuration sides
const userActions = require("./addons/userActions");
const { modelBooks } = require("./database/models");

app.use(express.json());
app.use("/user-actions", userActions);

// Book library handling
app.post("/save-book", (req, res) => {
    if (req.body.password && req.body.book_data) {
        const { password, book_data } = req.body;
    
        if (password == process.env.passwordAllowSave) {
            if (book_data.title && book_data.author && book_data.isbn) {
                modelBooks.create({ 
                    title: book_data.title, 
                    author: book_data.author, 
                    isbn: book_data.isbn 
                });
                res.sendStatus(202);
            }
            else res.sendStatus(403);
        }
        else res.sendStatus(401);
    }
    else res.sendStatus(403);
});

app.get("/get-books/:base_on/:id", async (req, res) => {
    const { base_on, id } = req.params;

    // Base status code establishement
    res.status(200);

    /**
     * 
     * @param {any[]} v 
     * @param {Response} res 
     */
    const returnV = (v, res) => {
        if (v.length) {
            res
                .status(200)
                .json(v)
        }
        else res.sendStatus(404);
    }

    switch(base_on) {
        // Give back all books avaiable in the store
        case "all":
            {
                const books = await modelBooks.aggregate([
                    { $match: {} },
                    { $project: { _id: false, __v: false } }
                ]);

                returnV(books, res);
            }
        break;

        // Give back one book refer to its isbn
        case "isbn":
            {
                const books = await modelBooks.aggregate([
                    { $match: {  $or: [{ isbn: id }, { isbn: { $regex: new RegExp(`^${id}`) } }] }},
                    { $project: { _id: false, __v: false } },
                ]);

                returnV(books, res);
            }
        break;

        // Give all books from author
        case "author":
            {
                const books = await modelBooks.aggregate([
                    { $match: { author: { $eq: id } } },
                    { $project: { _id: false, __v: false } },
                ]);

                returnV(books, res);
            }
        break;

        // Give all books base on its title
        case "title":
            {
                const books = await modelBooks.aggregate([
                    { $match: {  $or: [{ title: id }, { title: { $regex: new RegExp(`^${id}`) } }] }},
                    { $project: { _id: false, __v: false } },
                ]);

                returnV(books, res);
            }
        break;

        // Give book review and all user opinions
        case "review":

        break;

        default:
            res.sendStatus(404);
    }
});

app.listen(80);
