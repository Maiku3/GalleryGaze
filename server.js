const session = require('express-session');
const express = require('express');
const app = express();

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

// Referenced from tut9 demo to setup sessions
const MongoDBStore = require('connect-mongodb-session')(session);

// Defines the location of the sessions data in the database
var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/opengallery',
  collection: 'sessions'
});

app.use(session(
  {
    secret: 'super duper secret key',
    resave: true,
    saveUninitialized: false,
    store: store
  })
);

app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Change host to localhost or openstack
let host = ["localhost", "YOUR_OPENSTACK_IP"];

// Set up pug
app.set('views', './views');
app.locals.basedir = './views';
app.set("view engine", "pug");

// Serve static js files
app.use(express.static("./public"));

app.use(express.json());

const Artwork = require('./models/ArtworkModel.js');
const User = require('./models/UserModel.js');
const Review = require('./models/ReviewModel.js');
const Post = require('./models/PostModel.js');

// Set up routers
let userRouter = require('./routes/user-router.js');
app.use('/users', userRouter);
let artworkRouter = require('./routes/artwork-router.js');
app.use('/artworks', artworkRouter);
let reviewsRouter = require('./routes/review-router.js');
app.use('/reviews', reviewsRouter);

// GET for the root path to the website, the home page
app.get(['/', '/home'], getHome);

// GET for the search artworks page
app.get('/searchArtworks', getSearchArtworks);

// GET request for add artwork page only if user is logged in and is an artist
app.get('/addArtwork', addArtworkPage);

// PUT request to update the user artist field to true
app.put("/becomeArtist", becomeArtist);

app.put("/becomePatron", becomePatron);

// GET for rendering the registration page
app.get("/register", getRegisterPage);

// POST for saving the user registration to the database.
app.post("/register", register);

// POST to login and searches the users database to match the username and password
app.post("/login", login);

// GET to log user out and redirect to home page
app.get("/logout", logout);

/*
Functions
*/

// Function to render the registering page
function getRegisterPage(req, res) {
  res.render("pages/register", { session: req.session });
}

// Function to register user and add to database
async function register(req, res) {
  let newUser = req.body;

  try {
    const searchResult = await User.findOne({ username: newUser.username });
    if (searchResult == null) {
      console.log("registering: " + JSON.stringify(newUser));
      await User.create(newUser);
      res.status(200).send();
    } else {
      console.log("Send error.");
      res.status(404).json({ 'error': 'Exists' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error registering" });
  }
}

// Function to login user and set session variables
async function login(req, res) {
  let username = req.body.username;
  let password = req.body.password;

  try {
    const searchResult = await User.findOne({ username: username });
    if (searchResult != null) {
      if (searchResult.password === password) {
        // when we successfully matched the username and password
        req.session.loggedin = true;
        req.session.username = searchResult.username;
        req.session.userid = searchResult._id;
        req.session.artist = searchResult.artist;
        app.locals.userid = searchResult._id;
        res.redirect(`http://${host[0]}:3000/home`);
      } else {
        res.status(401).send("Not authorized. Invalid password.");
      }
    } else {
      res.status(401).send("Not authorized. Invalid password.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error logging in." });
  }
}

// Function to logout user and redirect to home page
function logout(req, res) {
  // Set the session loggedin property to false.
  if (req.session.loggedin) {
    req.session.loggedin = false;
  }
  res.redirect(`http://${host[0]}:3000/home`);

}

// Function to upgrade user to artist if they are not already
async function becomeArtist(req, res) {
  // check if user has posted any artworks
  const searchResult = await Artwork.findOne({ artist: req.session.username });
  if (searchResult == null) {
    req.session.artist = true;
    res.status(404).send("You have not posted any artworks yet.");
    return;
  } else {
    // update the user collection artist field to true
    req.session.artist = true;
    await User.updateOne({ username: req.session.username }, { artist: true });
    res.status(200).send();
  }

}

// Function to downgrade user to patron if they are already
async function becomePatron(req, res) {
  // update the user collection artist field to false
  req.session.artist = false;
  await User
    .updateOne({ username: req.session.username }, { artist: false });
  res.status(200).send();
}


// Renders home page
function getHome(req, res) {
  // get random 10 artworks from artworks collection in the database
  Artwork.aggregate([{ $sample: { size: 10 } }])
    .then((artworks) => {
      res.render('./pages/home', { session: req.session, artworks: artworks });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error: " + err);
    }
    );
}

// Renders add artwork page only if user is logged in and is an artist
function addArtworkPage(req, res) {
  // check artist status of user document
  if (req.session.loggedin) {
    User.findOne({ username: req.session.username })
      .then((user) => {
        if (user.artist || req.session.artist) {
          res.render('./pages/addArtwork', { session: req.session });
        } else {
          res.status(401).send("Not authorized. You are not an artist.");
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error: " + err);
      });
  } else {
    res.status(401).send("Not authorized. You are not logged in.");
  }
}

// Function to render the search artworks page
function getSearchArtworks(req, res) {
  res.render('./pages/searchArtworks', { session: req.session });
}

// Like Tutorial 9 demo, an async function to load the data.
const loadData = async () => {

  //Connect to the database
  const result = await mongoose.connect('mongodb://localhost:27017/opengallery');
  return result;

};

// If data loads, start the server
loadData()
  .then(() => {
    app.listen(PORT);
    console.log("Listen on port:", PORT);

  })
  .catch(err => console.log(err));





