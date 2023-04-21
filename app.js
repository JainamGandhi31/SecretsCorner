require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

// requiring packages for session
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { rsort } = require("semver");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine","ejs");

// setting up the session
app.use(session({
    secret: "ThisIsNotASecret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});

// adding passportLocalMongoose as a plugin to user schema
userSchema.plugin(passportLocalMongoose); 
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema); //model with passport-local-mongoose plugged in

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
   done(null,user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id,(err,user)=>{
        done(err,user);
    })
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password, (err,user)=>{
        if(err){
            console.log("error registering the user");
            console.log(err);
            res.redirect("/register")
        }
        else{
            // Because we are authenticating our user and setting up a logged in session for them then even if they just go directly to the secrets page then they should automatically able to view it if they are still logged in
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})


app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.get("/logout",(req,res)=>{
    // when user logs out we have to deauthenticate the user and end his session
    req.logout((err)=>{
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
})

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})