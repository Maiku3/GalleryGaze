const express = require('express');
const User = require('../models/UserModel.js');
const ObjectId = require('mongoose').Types.ObjectId
const Artwork = require('../models/ArtworkModel.js');
const Review = require('../models/ReviewModel.js');
let router = express.Router();

let host = ["localhost", "YOUR_OPENSTACK_IP"];

// routes
router.get("/", queryParser);
router.get("/", loadUsers);
router.get("/", respondUsers);

router.post("/", express.json(), createUser);

router.get("/:uid", sendSingleUser);

// Handle POST request to unfollow a user
router.delete("/:uid/unfollow", unfollow);
// Handle POST request to follow a user
router.post("/:uid/follow", follow);

//Handle GET request to return the user's artworks page
router.get("/:uid/artworks", async (req, res) => {
	console.log("following:" + req.isFollowing);
	res.render("partials/artworks", { session: req.session, user: req.user, following: req.isFollowing });
});

// Handle GET request to return the user's following page
router.get("/:uid/following", async (req, res) => {
	let following = req.user.following;
	let users = [];
	for (let i = 0; i < following.length; i++) {
		let user = await User.findOne({ _id: following[i] });
		users.push(user);
	}
	res.render("partials/followings", { session: req.session, user: req.user, artists: users, following: req.isFollowing });
});

// Handle GET request to return the user's followers page
router.get("/:uid/followers", async (req, res) => {
	let followers = req.user.followers;
	let users = [];
	for (let i = 0; i < followers.length; i++) {
		let user = await User.findOne({ _id: followers[i] });
		users.push(user);
	}
	res.render("partials/followers", { session: req.session, user: req.user, artists: users, following: req.isFollowing });
});

// Handle GET request to return the user's reviewed artworks page
router.get("/:uid/reviewed", (req, res) => {
	// find all artworks that have been reviewed by the user
	req.user.findReviewedArtworks(function (err, result) {
		if (err) {
			console.log(err);
			res.status(500).send("Error reading artworks.");
			return;
		}
		res.render("partials/reviewed", { session: req.session, user: req.user, following: req.isFollowing, reviewed: result });
	});
});

// Handle GET request to return the user's reviews page
router.get("/:uid/reviews", (req, res) => {
	// find all reviews that have been written by the user
	req.user.findReviews(function (err, result) {
		if (err) {
			console.log(err);
			res.status(500).send("Error reading reviews.");
			return;
		}
		res.render("partials/usersReviews", { session: req.session, user: req.user, following: req.isFollowing, reviews: result });
	});
});

//Load a user based on uid parameter
router.param("uid", function (req, res, next, value) {
	let oid;
	console.log("Finding user by ID: " + value);
	try {
		oid = new ObjectId(value);
	} catch (err) {
		res.status(404).send("User ID " + value + " does not exist.");
		return;
	}

	User.findById(value, function (err, result) {
		if (err) {
			console.log(err);
			res.status(500).send("Error reading user.");
			return;
		}

		if (!result) {
			res.status(404).send("User ID " + value + " does not exist.");
			return;
		}

		console.log("Result:");
		console.log(result);
		req.user = result;

		// check if current user is following this user
		req.isFollowing = req.user.followers.includes(new ObjectId(req.session.userid));

		result.findArtworks(function (err, result) {
			if (err) {
				console.log(err);
				//we will assume we can go on from here
				//we loaded the user information successfully
				next();
				return;
			}
			req.user.posts = result;
			next();
		})
	});
});

//Parse the query parameters
//limit: integer specifying maximum number of results to send back
//page: the page of results to send back (start is (page-1)*limit)
//name: string to find in user names to be considered a match
function queryParser(req, res, next) {
	const MAX_USERS = 50;

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
		if (req.query.limit > MAX_USERS) {
			req.query.limit = MAX_USERS;
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

	if (!req.query.name) {
		req.query.name = "?";
	}

	next();
}

//Loads the correct set of users based on the query parameters
//Adds a users property to the response object
//This property is used later to send the response
function loadUsers(req, res, next) {
	let startIndex = ((req.query.page - 1) * req.query.limit);
	let amount = req.query.limit;

	User.find()
		.where("username").regex(new RegExp(".*" + req.query.name + ".*", "i"))
		.limit(amount)
		.skip(startIndex)
		.exec(function (err, results) {
			if (err) {
				res.status(500).send("Error reading users.");
				console.log(err);
				return;
			}
			res.users = results;
			next();
			return;
		});
}

//Users the res.users property to send a response
//Sends either HTML or JSON, depending on Accepts header
function respondUsers(req, res, next) {
	res.format({
		"text/html": () => { res.render("pages/users", { users: res.users, qstring: req.qstring, current: req.query.page }) },
		"application/json": () => { res.status(200).json(res.users) }
	});
	next();
}

//Creates a new user with fake details
//In a real system, we could extract the user information
// from the request (e.g., form data or JSON from client-side)
function createUser(req, res, next) {
	//Create the user
	let u = new User();
	u.name = faker.name.firstName() + " " + faker.name.lastName();
	u.address = { address: faker.address.streetAddress(), city: faker.address.city(), state: faker.address.state(), zip: faker.address.zipCode() };

	u.save(function (err, result) {
		if (err) {
			console.log(err);
			res.status(500).send("Error creating user.");
			return;
		}
		res.status(201).send(JSON.stringify(u));
	})
}

//Send the representation of a single user that is a property of the request object
//Sends either JSON or HTML, depending on Accepts header
function sendSingleUser(req, res, next) {
	res.format({
		"application/json": function () {
			res.status(200).json(req.user);
		},
		"text/html": () => {
			// if user has no artworks set artist status to false
			if (req.user.posts.length == 0) {
				req.session.artist = false;
				User.updateOne({ username: req.session.username }, { artist: false });
			}
			res.render("partials/artworks", { session: req.session, user: req.user, following: req.isFollowing });
		}
	});
	next();
}

async function follow(req, res) {
	let user = await User.findOne({ username: req.session.username });
	let id = req.user._id;

	// update the current user collection following field
	let following = user.following
	following.push(id);
	await User.updateOne({ username: req.session.username }, { following: following });

	// update the artist user's followers field
	let followers = req.user.followers
	followers.push(user._id);
	await User.updateOne({ _id: id }, { followers: followers });

	res.status(200).send();
}

async function unfollow(req, res) {
	let user = await User.findOne({ username: req.session.username });
	let id = req.user._id;

	// update the current user collection following field
	let following = user.following
	following.splice(following.indexOf(req.user._id), 1);
	await User.updateOne({ _id: user._id }, { following: following });

	// update the user collection followers field
	let followers = req.user.followers
	followers.splice(followers.indexOf(user._id), 1);
	await User.updateOne({ _id: id }, { followers: followers });

	res.status(200).send();
}

//Export the router object so we can access it in the base app
module.exports = router;