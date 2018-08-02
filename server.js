'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;
app.use(cors());

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  url: String,
  _id: Number
});
const Url = mongoose.model('Url', urlSchema);
var dataCount;

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post("/api/shorturl/new", function(req, res){
  const reqUrl = req.body.url;
  // Check if url is valid
  // https://stackoverflow.com/questions/161738/what-is-the-best-regular-expression-to-check-if-a-string-is-a-valid-url
  const regex = /^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$/
  if(!regex.test(reqUrl)){
    res.json({"error":"invalid URL"});
  }
  // Check if hostname is valid
  const urlDomain = url.parse(reqUrl).hostname;
  dns.lookup(urlDomain, function(err, address, family) {
    if (err) {
      res.json({"error":"invalid Hostname"});
    }
    // Get database length
    Url.find({}, function(err, docs) {
      if (err) throw err;
      dataCount = docs.length + 1;
    });
    // Get existing short_url or create new one
    Url.findOne({url: reqUrl}, function (err, data){
      if (err) throw err;
      if (data) {
        res.json({"original_url": reqUrl, "short_url": data._id})
      }
      else {
        const newUrl = new Url({url: reqUrl, _id: dataCount});
        newUrl.save();
        res.json({"original_url": reqUrl, "short_url": dataCount});
        dataCount ++;
      }
    });
  });
});

app.get("/api/shorturl/:id", function(req, res){
  Url.findOne({_id: req.params.id}, function (err, data){
    if (err) throw err;
    if (data) {
      return res.redirect(data.url);
    }
    else {
      res.json({"error":"No short url found for given input"});
    }
  });
});

app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});