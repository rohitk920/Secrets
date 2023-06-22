//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// const md5 = require('md5'); md5 Hashing
// const encrypt = require('mongoose-encryption'); Simple Encryption

mongoose.connect(process.env.DB_URL)

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

// user schema

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


// userSchema.plugin(encrypt, { secret: process.env.secret ,encryptedFields:['password']});

const user = new mongoose.model('user',userSchema);


app.get('/',(req,res)=>{
    res.render("home")
})

app.get('/login',(req,res)=>{
    res.render("login")
})

app.get('/register',(req,res)=>{
    res.render("register")
})

app.get('/submit',(req,res)=>{
    res.render("submit")
})



app.post('/register',(req,res)=>{ // Register

    const hash = bcrypt.hashSync(req.body.password, saltRounds);
 
    const newUser = new user({
      email: req.body.username,
   
            // bcrypt
      password: hash
    });
    newUser.save().then(()=>{
      res.render("secrets");
    }).catch((err)=>{
       consule.log(err)
    })
  });

app.post('/login',(req,res)=>{

    const username= req.body.username;
    // const password=md5(req.body.password);
    
    const password=req.body.password;


    user.findOne({ email:username}).then((userFound) => {
        if (userFound) {
        if (bcrypt.compareSync(password, userFound.password)) {
            res.render("secrets");
        }
        }
}).catch((err) => {
    res.send(err);
});
})


app.listen(port, () => {
  console.log(`Server listening on port 3000`);
});