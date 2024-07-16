const { Response } = require("express"); // types
const express = require("express");
const app = express();
const session = require("express-session");

// Load environmental variables to process.env
require("dotenv").config();

// User configuration sides
const userActions = require("./addons/userActions");
const { modelBooks } = require("./database/models");
const { review } = require("./database/schema/books");

app.use(express.json());
app.use(session({ secret: process.env.cookieSecret, cookie: { maxAge: 60000 }, resave: true, saveUninitialized: false}))

// User actions
app.use("/user-actions", userActions);

// Search by author
// Get all books from specific author
app.get("/by-author/:author", async (req, res) => {
    const author = req.params.author;
    // const seek = await modelBooks.find({ author: { $eq: author } }, { _id: 0, __v: 0 });
    const seekBooks = await modelBooks.aggregate([
        { $match: { author: { $eq: author } } },
        { $project: { _id: 0, __v: 0, reviews: 0 } }
    ])

    if (seekBooks.length) {
        res.status(200)
            .json({ "books_by_author": seekBooks })
    }
    else res.sendStatus(404);
});

// Get books by title
// You can pass here the part of title
app.get("/by-title/:title", async (req, res) => {
    const { title } = req.params;
    // const byTitle = await modelBooks.find({ title: { $regex: new RegExp(`${title}`) } });
    const byTitle = await modelBooks.aggregate([
        { $match: { title: { $regex: new RegExp(`${title}`) } } },
        { $project: { _id: 0, __v: 0, reviews: 0 } }
    ]);

    if (byTitle.length) {
        res.status(200)
            .json({ "books_by_title": byTitle })   
    }
    else res.sendStatus(404);
});

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

app.post("/add-reviews/:book_isbn", async (req, res) => {
    const { book_isbn } = req.params;

    if (modelBooks.exists({ isbn: { $eq: book_isbn } })) {
        /**
         * @type {{ reviews: {rating, author, date}[] }}
         */
        const body = req.body;
        const checkRatingEvery = body.reviews.every((v) => {
            return v.rating >= 1 && v.rating <= 5
        })

        if (body?.reviews?.length && checkRatingEvery) {
            const _findByISBN = await modelBooks.updateOne({
                isbn: book_isbn 
            }, { $push: { reviews: { $each: body.reviews } } });
            res.sendStatus(202);
        }
        else res.sendStatus(400);
    }
    else res.sendStatus(404);
});

// Send 200 status when found book where reviews should appear
app.get("/book-reviews/:book/:mode", async (req, res) => {
    /*
     * Book can state: title, isbn
     * mode can be: all or single id
    */
    const { book, mode } = req.params;
    const bookReviewsSearch = await modelBooks.aggregate([
        { $match: { $or: [{ isbn: book }, { title: book }] } },
        // { $unwind: "$reviews" },
        { $project: { _id: 0, __v: 0, "reviews._id": 0 } }
    ])

    if (bookReviewsSearch[0]) {
        switch(mode) {
            case "all":
                res.status(200)
                   .json({ "reviews": bookReviewsSearch[0].reviews })
            break;

            // Search specific book review
            default:
                const agrOp = await modelBooks.aggregate([
                    { $match: { $or: [{ isbn: book }, { title: book }] } },
                    { $unwind: { path: "$reviews" } },
                    { $match: { "reviews.id": { $eq: mode } } },
                    { $project: { "reviews._id": 0 } }
                ])

                console.log(agrOp[0])

                if (agrOp.length) {
                    res.status(200)
                        .json({ "reviews": [agrOp[0].reviews] })
                }
            break;
        }
    }

    if (express.response.headersSent) res.sendStatus(404);
})

// Modify review but only when you're its author
app.post("/modify-review/:book/:review_id", async (req, res) => {
    const { book, review_id } = req.params;
    /**
        @type {{ author: string, content?: string, rating?: number }}
        * User can modify only content or rating but only when is its author
    */
    const body = req.body;
    const review = await modelBooks.aggregate([
        { $match: { $or: [{ isbn: { $eq: book } }, { title: { $eq: book } }] } },
        { $unwind: "$reviews" },
        { $project: { reviews: 1 } },
        { $match: { "reviews.id": { $eq: review_id } } }
    ]);

    if (review) {
        // Only when review has same author that tries to edit
        if (body.author == review[0]?.reviews.author) {
            let updateCommand = {};

            if (body.content?.length) {
                updateCommand["reviews.$.content"] = body.content;
            }

            if (body.rating && body.rating >= 1 && body.rating <= 5) {
                updateCommand["reviews.$.rating"] = body.rating;
            }

            const updateAc = await modelBooks.findOneAndUpdate({ "reviews.id": review_id }, { $set: updateCommand })

            if (updateAc) res.sendStatus(200);
        }
        else res.sendStatus(401)
    }
    else res.sendStatus(404);
});

// Delete review
app.delete("/delete-review/:book/:review_id", async (req, res) => {
    const { book, review_id } = req.params;
    /**
     * @type {{ delete_password: string }}
     */
    const body = req.body;

    if (body.delete_password == process.env.passwordAllowDelete) {
        const deleteOp = await modelBooks.updateOne({ $or: [{ isbn: book }, { title: book }] }, { $pull: { reviews: {
            id: { $eq: review_id }
        } } })

        if (deleteOp.modifiedCount == 1) {
            res.sendStatus(200)
        }
        else res.sendStatus(404)   
    }
    else res.sendStatus(401);
})

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
