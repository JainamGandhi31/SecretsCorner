const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SOME_LONG_UNGUESSABLE_STRING;

// If we don't specify encryptedFields parameter then it will encrypt all the fields in our database which we don't want
// By passing the 2nd parameter it tells to only encrypt password field of the database. we can also add multiple fields.

userSchema.plugin(encrypt, {secret: secret, encryptedFields:['password']});

const User = mongoose.model("User",userSchema);
app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.post("/register",(req,res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err)=>{
        if(!err){
            res.render("secrets");
        }
        else{
            res.send(err);
        }
    })
})


app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}).exec((err,foundUser)=>{
       if(err){
        res.send(err);
       }
       else{
        if(foundUser && foundUser.password === password){
            console.log(foundUser.password);
            res.render("secrets");
        }
       }
    })
})

app.get("/logout",(req,res)=>{
    res.redirect("/");
})

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})