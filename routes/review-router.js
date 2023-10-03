const express = require('express');
const User = require('../models/UserModel.js');
const ObjectId = require('mongoose').Types.ObjectId
const Artwork = require('../models/ArtworkModel.js');
const Review = require('../models/ReviewModel.js');
const Post = require('../models/PostModel.js');
let router = express.Router();

// routes
router.get("/", queryParser); //Parse the query parameters
router.get("/", loadReviews); //Load matching reviews
router.get("/", respondReviews); //Send the response
router.get("/:id", sendSingleReview);

router.delete("/:id", deleteReview);

// finds the review with the given id
router.param("id", function (req, res, next, value) {
    let oid;
    console.log("Finding review by ID: " + value);
    try {
        oid = new ObjectId(value);
    } catch (err) {
        console.log(err);
        res.status(404).send("That review does not exist.");
        return;
    }

    Review.findById(oid, function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error reading review.");
            return;
        }

        if (!result) {
            res.status(404).send("Review ID " + value + " does not exist.");
            return;
        }

        req.review = result;
        console.log("Result:");
        console.log(result);

        // find the artwork that the review is for
        Artwork.findById(req.review.artwork, function (err, result) {
            if (err) {
                console.log(err);
                res.status(500).send("Error reading artwork.");
                return;
            }

            if (!result) {
                res.status(404).send("Artwork ID " + req.review.artwork + " does not exist.");
                return;
            }

            req.review.artwork = result;
            console.log("Result:");
            console.log(result);

            // find the user that wrote the review
            User.findById(req.review.user, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send("Error reading user.");
                    return;
                }

                if (!result) {
                    res.status(404).send("User ID " + req.review.user + " does not exist.");
                    return;
                }

                req.review.user = result;
                console.log("Result:");
                console.log(result);
                next();
            });
        });
    });
});

//Parses the query parameters. Possible parameters:
//limit: integer specifying maximum number of results to send back
//page: the page of results to send back (start is (page-1)*limit)
function queryParser(req, res, next) {
    const MAX_REVIEWS = 50;

    //build a query string to use for pagination later
    let params = [];
    for (prop in req.query) {
        if (prop == "page") {
            continue;
        }
        params.push(prop + "=" + req.query[prop]);
    }
    req.qstring = params.join("&");

    try {
        req.query.limit = req.query.limit || 10;
        req.query.limit = Number(req.query.limit);
        if (req.query.limit > MAX_REVIEWS) {
            req.query.limit = MAX_REVIEWS;
        }
    } catch {
        req.query.limit = 10;
    }

    try {
        req.query.page = req.query.page || 1;
        req.query.page = Number(req.query.page);
        if (req.query.page < 1) {
            req.query.page = 1;
        }
    } catch {
        req.query.page = 1;
    }

    // query for artwork id
    if (req.query.artwork) {
        req.query.artwork = new ObjectId(req.query.artwork);
    }

    next();
}

//Loads correct reviews and creates a reviews property in response object
//Users specified query parmeters to get the correct amount
function loadReviews(req, res, next) {
    let startIndex = ((req.query.page - 1) * req.query.limit);
    let amount = req.query.limit;
    let artwork = req.query.artwork;

    Review.find()
        .where("artwork").equals(artwork)
        .limit(amount)
        .skip(startIndex)
        .exec(function (err, results) {
            if (err) {
                res.status(500).send("Error reading users.");
                console.log(err);
                return;
            }
            req.reviews = results;
            next();
            return;
        });
}

//Sends loaded reviews in response
//Sends either JSON or HTML, depending on Accepts header
function respondReviews(req, res, next) {

    res.format({
        "text/html": () => { res.render("pages/reviews", { session: req.session, reviews: req.reviews, qstring: req.qstring, current: req.query.page }) },
        "application/json": () => { res.status(200).json(req.reviews) }
    });
    next();
}

//Create response for a single review (/reviews/:id)
//Sends either JSON or HTML
function sendSingleReview(req, res, next) {
    res.format({
        "application/json": function () {
            res.status(200).json(req.review);
        },
        "text/html": () => {
            res.render("pages/review", { session: req.session, review: req.review });

        }
    });
    next();
}

function deleteReview(req, res, next) {
    Review.deleteOne({ _id: req.review._id }, function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error deleting review.");
            return;
        }

        if (!result) {
            res.status(404).send("Review ID " + req.review._id + " does not exist.");
            return;
        }

        // find artwork
        Artwork.findById(req.review.artwork, function (err, result) {
            if (err) {
                console.log(err);
                res.status(500).send("Error reading artwork.");
                return;
            }
            res.status(200).send(result);
            next();
        });
    });

}
//Export the router object so we can access it in the base app
module.exports = router;