//var cors = require('cors')
import { ApiClient } from '@twurple/api';
import { RefreshingAuthProvider , StaticAuthProvider, ClientCredentialsAuthProvider } from '@twurple/auth';
import { NgrokAdapter } from '@twurple/eventsub-ngrok';
import { ChatClient } from '@twurple/chat';
import { DirectConnectionAdapter, EventSubListener } from '@twurple/eventsub';
import {promises as fs} from 'fs';
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
    {
		clientId,
		clientSecret,
		onRefresh: async newTokenData => {
            config.token = newTokenData;
            await fs.writeFile('./config.json', JSON.stringify(config, null, 4), 'UTF-8');
        }
	},
	config.token
);
console.log("Getting app token auth provider");
const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });
console.log("Getting user id");
const userId = (await apiClient.users.getUserByName('allymonies')).id;

const chatClient = new ChatClient({ authProvider: chatAuthProvider,  channels: ['allymonies'] });
// listen to more events...
console.log("Connecting to chat");
await chatClient.connect();


//var config = require('./config/config.json');
const port = 3000;//config.port;
const host = "127.0.0.1"

/*var corsOptions = {
  origin: config.website,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}*/

//app.use(cors(corsOptions))
app.use(express.static('static',{index:"index.html",extensions:['html']}));
app.use(express.static('static'));

const clients = [];

app.ws('/ws', function(ws, req) {
    ws.on('message', function(msg) {
      console.log(msg);
    });
    console.log('Websocket connection');
});
const wsServer = expressWs.getWss('/ws');

function broadcast(payload) {
    wsServer.clients.forEach(function (client) {
        client.send(JSON.stringify(payload));
    });
}

const chatListener = chatClient.onMessage(async (channel, user, message, msg) => {
    console.log("Got message", message, "from", user);
    if (message[0] == '!') {
        const command = message.substr(1).split(' ');
        console.log("Got command", command);
        if (command[0] == 'jump') {
            broadcast({"type": "command", "command": "jump"});
        } else if (command[0] == 'spin' && admins.includes(user.toLowerCase())) {
            broadcast({"type": "command", "command": "spin"});
        } else if (command[0] == 'testfollow' && command.length > 1 && admins.includes(user.toLowerCase())) {
            broadcast({"type": "follow", "user": command[1], "displayName": command[1]});
        } else if (command[0] == 'flip' && admins.includes(user.toLowerCase())) {
            broadcast({"type": "command", "command": "flip"});
        }
    } else {
        broadcast({"type": "message", "user": user, "message": message});
    }
});

apiClient.eventSub.deleteAllSubscriptions()
const listener = new EventSubListener({
    apiClient,
    adapter: new NgrokAdapter(),
    secret: config.eventSubSecret
});
console.log("Starting event listener");
await listener.listen();

console.log("Creating subscriptions");
const followSubscription = await listener.subscribeToChannelFollowEvents(userId, e => {
    const name = e.userDisplayName ?? e.userName;
    console.log(name, " followed!");
    broadcast({"type": "follow", "user": e.userName, "displayName": name});
});

const channelUpdateSupscription = await listener.subscribeToChannelUpdateEvents(userId, e => {
    console.log("Got a channel update event");
    /*wsServer.clients.forEach(function (client) {
        client.send(JSON.stringify({"type": "follow"}));
    });*/
});

var server = app.listen(port, host, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("CHAT CUBE CHAT CUBE on", host, port);
})