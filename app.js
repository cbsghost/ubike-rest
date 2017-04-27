var express = require('express');

var index = require('./routes/index');
var my_api = require('./routes/my-api');

var app = express();

app.use(express.static('public'));
app.use('/', index);
app.use('/v1/ubike-station', my_api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.json({ message: "404, Appier Code Challenge..." });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.json({ message: "500, Appier Code Challenge..." });
});

module.exports = app;
