//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy; //oauth2.0 Google
const findOrCreate = require('mongoose-findorcreate');

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

// const md5 = require('md5'); md5 Hashing
// const encrypt = require('mongoose-encryption'); Simple Encryption


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "our littel secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB_URL)


// user schema

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// userSchema.plugin(encrypt, { secret: process.env.secret ,encryptedFields:['password']});

const user = new mongoose.model('user', userSchema);

passport.use(user.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] 
}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



app.get('/login', (req, res) => {
    res.render("login")
})

app.get('/register', (req, res) => {
    res.render("register")
})

app.get('/submit', (req, res) => {
    res.render("submit")
})

app.get("/logout", function (req, res) {
    req.logOut((err) => {});
    res.redirect("/");
})

app.get("/secrets", function (req, res) {
user.find({"secret":{$ne:null}})
.then((foundUsers) => {
    if (foundUsers) {
        res.render("secrets",{userwithSecret:foundUsers})
    }
    return null;
  })
  .catch((err) => {
    res.send(err);
  });
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});



app.post('/register', (req, res) => { // Register

    // const hash = bcrypt.hashSync(req.body.password, saltRounds);

    // const newUser = new user({
    //   email: req.body.username,

    //         // bcrypt
    //   password: req.body.password
    // });
    // newUser.save().then(()=>{
    //   res.render("secrets");
    // }).catch((err)=>{
    //    consule.log(err)
    // })


    user.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    });
});

app.post('/login', (req, res) => {

    //     const username= req.body.username;

    //     // const password=md5(req.body.password);

    //     const password=req.body.password;


    //     user.findOne({ email:username}).then((userFound) => {
    //         if (userFound) {
    //         // if (bcrypt.compareSync(password, userFound.password))
    //         if(!userFound) {
    //             res.render("secrets");
    //         }
    //         }
    // }).catch((err) => {
    //     res.send(err);
    // });

    const user1 = new user({
        username: req.body.username,
        password: req.body.password
    })


    req.login(user1, (err) => {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }});
})



app.post('/submit',(req, res) => {
    const submittedSecret = req.body.secret;
    const userId = req.user.id;

    user.findById(userId)
      .then((foundUser) => {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          return foundUser.save();
        }
        return null;
      })
      .then(() => {
        res.redirect("/secrets");
      })
      .catch((err) => {
        res.send(err);
      });
  });


app.listen(port, () => {
    console.log(`Server listening on port 3000`);
});