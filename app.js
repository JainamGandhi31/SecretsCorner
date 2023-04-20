const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


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
        email: req.body.userName,
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
    const username = req.body.userName;
    const password = req.body.password;

    User.findOne({email: username}).exec((err,foundUser)=>{
       if(err){
        res.send(err);
       }
       else{
        if(foundUser && foundUser.password === password){
            res.render("secretss");
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