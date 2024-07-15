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

    switch(base_on) {
        // Give back all books avaiable in the store
        case "all":
            {

            }
        break;

        // Give back one book refer to its isbn
        case "isbn":

        break;

        // Give all books from author
        case "author":

        break;

        // Give all books base on its title
        case "title":

        break;

        // Give book review and all user opinions
        case "review":

        break;

        default:
            res.sendStatus(404);
    }
});

app.listen(80);
