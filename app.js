const dotenv = require("dotenv");
const express = require("express");
const app = express();
const userActions = require("./addons/userActions");

dotenv.config({ encoding: "utf-8" });

// Sign-in/Sign-up user there
app.use("/user-actions", userActions);

// Book library handling
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
