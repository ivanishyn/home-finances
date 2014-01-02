
var config = require('./config'),
    pkg = require('../package'),
    express = require('express'),
    app = express(),
    exctrl = require('exctrl'),
    mongoose = require('mongoose'),
    mongoload = require('mongoload');

mongoose.connect(config.db);

mongoload
  .bind(mongoose)
  .load({
    pattern: __dirname + '/api/**/*.model.js',
    nameRegExp: /([^\/\\]+).model.js$/
  });


app.use(express.bodyParser());
app.use(express.methodOverride());

exctrl
  .bind(app)
  .load({
    pattern: __dirname + '/api/**/*.controller.js',
    prefix: 'api',
    nameRegExp: /([^\/\\]+).controller.js$/
  });

module.exports = app;
