//var cors = require('cors')
import ***REMOVED*** ApiClient ***REMOVED*** from '@twurple/api';
import ***REMOVED*** RefreshingAuthProvider , StaticAuthProvider, ClientCredentialsAuthProvider ***REMOVED*** from '@twurple/auth';
import ***REMOVED*** NgrokAdapter ***REMOVED*** from '@twurple/eventsub-ngrok';
import ***REMOVED*** ChatClient ***REMOVED*** from '@twurple/chat';
import ***REMOVED*** DirectConnectionAdapter, EventSubListener ***REMOVED*** from '@twurple/eventsub';
import ***REMOVED***promises as fs***REMOVED*** from 'fs';
import express from 'express';
import express_ws from 'express-ws';
var app = express();
//import config from './config.js';
const expressWs = express_ws(app);

let config = JSON.parse(await fs.readFile("./config.json"));
const admins = ["allymonies", "1lann", "synhayden"]

const clientId = config.clientId;
const accessToken = config.accessToken;
const clientSecret = config.clientSecret;
console.log("Getting chat auth provider");
const chatAuthProvider = new RefreshingAuthProvider(
    ***REMOVED***
		clientId,
		clientSecret,
		onRefresh: async newTokenData => ***REMOVED***
            config.token = newTokenData;
            await fs.writeFile('./config.json', JSON.stringify(config, null, 4), 'UTF-8');
        ***REMOVED***
	***REMOVED***,
	config.token
);
console.log("Getting app token auth provider");
const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient(***REMOVED*** authProvider ***REMOVED***);
console.log("Getting user id");
const userId = (await apiClient.users.getUserByName('allymonies')).id;

const chatClient = new ChatClient(***REMOVED*** authProvider: chatAuthProvider,  channels: ['allymonies'] ***REMOVED***);
// listen to more events...
console.log("Connecting to chat");
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
    console.log('Websocket connection');
***REMOVED***);
const wsServer = expressWs.getWss('/ws');

function broadcast(payload) ***REMOVED***
    wsServer.clients.forEach(function (client) ***REMOVED***
        client.send(JSON.stringify(payload));
    ***REMOVED***);
***REMOVED***

const chatListener = chatClient.onMessage(async (channel, user, message, msg) => ***REMOVED***
    console.log("Got message", message, "from", user);
    if (message[0] == '!') ***REMOVED***
        const command = message.substr(1).split(' ');
        console.log("Got command", command);
        if (command[0] == 'jump') ***REMOVED***
            broadcast(***REMOVED***"type": "command", "command": "jump"***REMOVED***);
        ***REMOVED*** else if (command[0] == 'spin' && admins.includes(user.toLowerCase())) ***REMOVED***
            broadcast(***REMOVED***"type": "command", "command": "spin"***REMOVED***);
        ***REMOVED*** else if (command[0] == 'testfollow' && command.length > 1 && admins.includes(user.toLowerCase())) ***REMOVED***
            broadcast(***REMOVED***"type": "follow", "user": command[1], "displayName": command[1]***REMOVED***);
        ***REMOVED*** else if (command[0] == 'flip' && admins.includes(user.toLowerCase())) ***REMOVED***
            broadcast(***REMOVED***"type": "command", "command": "flip"***REMOVED***);
        ***REMOVED***
    ***REMOVED*** else ***REMOVED***
        broadcast(***REMOVED***"type": "message", "user": user, "message": message***REMOVED***);
    ***REMOVED***
***REMOVED***);

apiClient.eventSub.deleteAllSubscriptions()
const listener = new EventSubListener(***REMOVED***
    apiClient,
    adapter: new NgrokAdapter(),
    secret: config.eventSubSecret
***REMOVED***);
console.log("Starting event listener");
await listener.listen();

console.log("Creating subscriptions");
const followSubscription = await listener.subscribeToChannelFollowEvents(userId, e => ***REMOVED***
    const name = e.userDisplayName ?? e.userName;
    console.log(name, " followed!");
    broadcast(***REMOVED***"type": "follow", "user": e.userName, "displayName": name***REMOVED***);
***REMOVED***);

const channelUpdateSupscription = await listener.subscribeToChannelUpdateEvents(userId, e => ***REMOVED***
    console.log("Got a channel update event");
    /*wsServer.clients.forEach(function (client) ***REMOVED***
        client.send(JSON.stringify(***REMOVED***"type": "follow"***REMOVED***));
    ***REMOVED***);*/
***REMOVED***);

var server = app.listen(port, host, function () ***REMOVED***
    var host = server.address().address
    var port = server.address().port
    console.log("CHAT CUBE CHAT CUBE on", host, port);
***REMOVED***)