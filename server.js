//var cors = require('cors')
import ***REMOVED*** ApiClient ***REMOVED*** from 'twitch';
import ***REMOVED*** AccessToken, RefreshableAuthProvider, StaticAuthProvider ***REMOVED*** from 'twitch-auth';
import ***REMOVED*** ChatClient ***REMOVED*** from 'twitch-chat-client';
import express from 'express';
import express_ws from 'express-ws';
var app = express();
import config from './config.js';
const expressWs = express_ws(app);

const clientId = config.clientId;
const accessToken = config.accessToken;
const clientSecret = config.clientSecret;
const refreshToken = config.refreshToken;
const authProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(clientId, accessToken),
    ***REMOVED***
        clientSecret,
        refreshToken,
        onRefresh: (token) => ***REMOVED***
	        // do things with the new token data, e.g. save them in your database
        ***REMOVED***
    ***REMOVED***
);
const apiClient = new ApiClient(***REMOVED*** authProvider ***REMOVED***);

const chatClient = new ChatClient(authProvider, ***REMOVED*** channels: ['allymonies'] ***REMOVED***);
// listen to more events...
await chatClient.connect();

//var config = require('./config/config.json');
const port = 3000;//config.port;
const host = "127.0.0.1"

/*var corsOptions = ***REMOVED***
  origin: config.website,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
***REMOVED****/

//app.use(cors(corsOptions))
app.use(express.static('static',***REMOVED***index:"index.html",extensions:['html']***REMOVED***));
app.use(express.static('static'));

const clients = [];

app.ws('/ws', function(ws, req) ***REMOVED***
    ws.on('message', function(msg) ***REMOVED***
      console.log(msg);
    ***REMOVED***);
    console.log('socket', req.testing);
***REMOVED***);
const wsServer = expressWs.getWss('/ws');

const chatListener = chatClient.onMessage(async (channel, user, message, msg) => ***REMOVED***
    wsServer.clients.forEach(function (client) ***REMOVED***
        client.send(JSON.stringify(***REMOVED***"type": "message", "user": user, "message": message***REMOVED***));
    ***REMOVED***);
***REMOVED***);

var server = app.listen(port, host, function () ***REMOVED***
  var host = server.address().address
  var port = server.address().port
  console.log("CHAT CUBE CHAT CUBE on", host, port);
***REMOVED***)