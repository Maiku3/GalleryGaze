const express = require('express');
const User = require('../models/UserModel.js');
const Artwork = require('../models/ArtworkModel.js');
const Post = require('../models/PostModel.js');
const ObjectId = require('mongoose').Types.ObjectId
const Review = require('../models/ReviewModel.js');

let router = express.Router();

// routes
router.get("/", queryParser);
router.get("/", loadArtworksDatabase);
router.get("/", respondArtworks);

router.post("/", express.json(), createArtwork);

router.get("/:id", sendSingleArtwork);

router.post("/:id/createReview", express.json(), createReview);

//If the id parameter exists, try to load a product
// that matches that ID. Respond with 404 error
// if invalid object ID or ID is not found.
router.param("id", function (req, res, next, value) {
    Artwork.findById(value, function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error reading artwork.");
            return;
        }

        if (!result) {
            res.status(404).send("Artwork ID " + value + " does not exist.");
            return;
        }

        req.artwork = result;
        console.log("Result:");
        console.log(result);

        Post.findOne().where('artwork').equals(new ObjectId(value)).exec(function (err, result) {
            if (err) {
                console.log(err);
                res.status(500).send("Error reading.");
                return;
            }

            if (!result) {
                res.status(404).send("Does not exist.");
                return;
            }

            req.post = result;
            console.log("Post Result:");
            console.log(result);

            // find review for artwork
            Review.find().where('artwork').equals(new ObjectId(value)).exec(function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send("Error reading.");
                    return;
                }

                if (!result) {
                    res.status(404).send("Does not exist.");
                    return;
                }

                req.artwork.reviews = result;
                console.log("Review Result:");
                console.log(result);
                next();
            });
        });
    });
});

//Parse the query parameters
//limit: integer specifying maximum number of results to send back
//page: the page of results to send back (start is (page-1)*limit)
//name: string to find in product name to be considered a match
//minprice: the minimum price to find
//maxprice: the maximum price to find
function queryParser(req, res, next) {
    const MAX_ARTWORKS = 50;

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
        if (req.query.limit > MAX_ARTWORKS) {
            req.query.limit = MAX_ARTWORKS;
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
    // query for artist
    if (!req.query.artist) {
        req.query.artist = "?";
    }

    // query for artwork name
    if (!req.query.name) {
        req.query.name = "?";
    }

    // query for artwork category
    if (!req.query.category) {
        req.query.category = "?";
    }

    // query for artwork medium
    if (!req.query.medium) {
        req.query.medium = "?";
    }
    next();
}

//Find mathching artworks by querying Artwork model
function loadArtworksDatabase(req, res, next) {
    let startIndex = ((req.query.page - 1) * req.query.limit);
    let amount = req.query.limit;

    Artwork.find()
        .where("artist").regex(new RegExp(".*" + req.query.artist + ".*", "i"))
        .where("name").regex(new RegExp(".*" + req.query.name + ".*", "i"))
        .where("category").regex(new RegExp(".*" + req.query.category + ".*", "i"))
        .where("medium").regex(new RegExp(".*" + req.query.medium + ".*", "i"))
        .limit(amount)
        .skip(startIndex)
        .exec(function (err, results) {
            if (err) {
                res.status(500).send("Error reading artworks.");
                console.log(err);
                return;
            }
            console.log("Found " + results.length + " matching artworks.");
            res.artworks = results;
            next();
            return;
        })
}

//Sends an array of artworks in response to a request
//Uses the artworks property added by previous middleware
//Sends either JSON or HTML
function respondArtworks(req, res, next) {
    res.format({
        "text/html": () => { res.render("pages/artworkResults", { session: req.session, artworks: res.artworks, qstring: req.qstring, current: req.query.page }) },
        "application/json": () => { res.status(200).json(res.artworks) }
    });
    next();
}

//Create a new random product in response to POST /products
function createArtwork(req, res, next) {
    // find user by name
    User.findOne().where('username').equals(req.body.artist).exec(function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error reading.");
            return;
        }
        let user = result;
        let artwork = new Artwork(req.body);
        artwork.save(function (err, result) {
            if (err) {
                res.status(500).send("Error creating artwork.");
                console.log(err);
                return;
            }

            let post = new Post({ artwork: result._id, user: user._id });
            post.save(function (err, result) {
                if (err) {
                    res.status(500).send("Error creating post.");
                    console.log(err);
                    return;
                }
                console.log("Created post: " + result);
                res.status(201).json(artwork);
            });
        });
    });
}

//Create and send representation of a single product
//Sends either JSON or HTML
function sendSingleArtwork(req, res, next) {
    res.format({
        "application/json": function () {
            res.status(200).json(req.artwork);
        },
        "text/html": () => {
            let uId = new ObjectId(req.post.user);

            User.findById(uId, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send("Error reading user.");
                    return;
                }
                if (!result) {
                    res.status(404).send("User does not exist.");
                    return;
                }
                // console.log("User Result" + result);
                res.render("pages/artwork", { session: req.session, artwork: req.artwork, user: result });
                next();
            });
        }
    });
}

// Create a new review 
function createReview(req, res, next) {
    let responseReview = req.body;
    responseReview.artwork = req.artwork._id;
    responseReview.user = new ObjectId(req.session.userid);
    let review = new Review(responseReview);

    review.save(function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error creating review.");
            return;
        }
        res.status(201).send(JSON.stringify(review));
    });
}
//Export the router object so we can access it in the base app
module.exports = router;