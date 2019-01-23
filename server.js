var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express');
var path = require('path');
var port = 443;

var options = {
    key: fs.readFileSync('./privkey.pem'),
    cert: fs.readFileSync('./fullchain.pem'),
};

var app = express();

var server = https.createServer(options, app).listen(port, function(){
  console.log("Express server listening on port " + port);
});

app.use(express.static('./build'))

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

/*
var StaticServer = require('static-server');

var server = new StaticServer({
  rootPath: 'public',            // required, the root of the server file tree
  port: 80,               // required, the port to listen
  name: 'burner-wallet',   // optional, will set "X-Powered-by" HTTP header
  host: '0.0.0.0',       // optional, defaults to any interface
  cors: '*',                // optional, defaults to undefined
  templates: {
    index: 'index.html',      // optional, defaults to 'index.html'
    notFound: 'index.html'    // optional, defaults to undefined
  }
});

server.start(function () {
  console.log('Server listening to', server.port);
});

server.on('request', function (req, res) {
  // req.path is the URL resource (file name) from server.rootPath
  // req.elapsedTime returns a string of the request's elapsed time
});

server.on('symbolicLink', function (link, file) {
  // link is the source of the reference
  // file is the link reference
  console.log('File', link, 'is a link to', file);
});

server.on('response', function (req, res, err, file, stat) {
  // res.status is the response status sent to the client
  // res.headers are the headers sent
  // err is any error message thrown
  // file the file being served (may be null)
  // stat the stat of the file being served (is null if file is null)

  // NOTE: the response has already been sent at this point
});
*/
