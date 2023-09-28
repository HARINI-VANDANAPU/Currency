const express = require('express'); 
const request = require('request');
const app = express();
const session=require("express-session");
const bp=require("body-parser");
const ejs=require("ejs");
const axios=require("axios");
const ph = require("password-hash");
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./firestore.json");
 
initializeApp({
    credential: cert(serviceAccount)
  });
  
const db = getFirestore();
  
app.get('/', function (req, res) {  
    res.render("signup",{errormessage:""})
})  

  
app.post('/signupSubmit', function (req, res) { 
  db.collection('usersDemo')
  .where("Email","==",req.body.email)
  .get()
  .then((docs)=>{
    if(docs.size>0){
      res.render("signup.ejs",{errormessage:"This account is already existed,Please login"})
    }
    else{
      db.collection('usersDemo').add({
        FullName:req.body.fullname,
        Email:req.body.email,
        Password:ph.generate(req.body.password),
    }).then(()=>{
      res.render("login")
    })
    }
  }) 
  
})
app.get('/login', function (req, res){
    res.render("login")

})

app.post("/loginSubmit", function (req,res) {  
    console.log(req.body);
    db.collection('usersDemo')
   .where("Email","==",req.body.email)
   .get()
   .then((docs)=>{
    let verified=false;
    docs.forEach((doc)=>{
      verified=ph.verify(req.body.password,doc.data().Password)
    })
    if(verified){
        req.session.authenticated = true;
        res.redirect('/dashboard')
    }
    else{
        res.send("Fail")
    }
   })
})
app.get("/dashboard",function(req,res){
    if(req.session.authenticated){
        res.render("dashboard",{Ans:"", amount: "", country1: "", country2: "",})
    }
    else{
        res.redirect('/login');
    }
});
app.post('/dashboard', (req, res) => {
  const from = req.body.fromcurrency;
  const to = req.body.tocurrency;
  const amount = parseFloat(req.body.amount);
  console.log(amount);
  console.log(from);
  console.log(to);
  request.get({
    url: 'https://api.api-ninjas.com/v1/convertcurrency?want=' + to + '&have=' + from + '&amount=' + amount,
    headers: {
      'X-Api-Key': 'x1pv7RtyedcS7Q1QMMbDLw==XqM9dHCKp7ZiQI6W'
    },
  },
    function(error, response, body) {
      const responseBody = JSON.parse(body);
      const result = responseBody.new_amount;
      console.log(result);
      res.render('dashboard.ejs', { Ans: result, amount: amount, country1:from, country2: to,});
    });
});
app.listen(7000, () => {
  console.log('server started');
});