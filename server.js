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
const admins = ["allymonies", "1lann", "synhayden", "samjk"]
const defaultPartyDuration = 30;

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

function checkPermissions(command, user) {
    if (command == 'jump') {
        return true;
    } else if (admins.includes(user.toLowerCase())) {
        return true;
    }
}

const chatListener = chatClient.onMessage(async (channel, user, message, msg) => {
    console.log("Got message", message, "from", user);
    if (message[0] == '!') {
        const args = message.substr(1).split(' ');
        const command = args.shift().toLowerCase();
        console.log("Got command", command, args);
        if (!checkPermissions(command, user)) {
            // Do nothing, no permissions;
            console.log(user, "doesn't have permissions to run", command);
            return;
        }
        if (command == 'jump') {
            broadcast({"type": "command", "command": "jump"});
        } else if (command == 'spin') {
            broadcast({"type": "command", "command": "spin"});
        } else if (command == 'testfollow' && args.length > 0) {
            broadcast({"type": "follow", "user": args[0], "displayName": args[0]});
        } else if (command == 'flip') {
            broadcast({"type": "command", "command": "flip"});
        } else if (command == 'party') {
            const duration = args.length > 0 ? parseInt(args[0]) : defaultPartyDuration;
            console.log("running a party of length", duration);
            if (duration > 0) {
                broadcast({"type": "command", "command": "party", "duration": duration});
            }
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

/*const subscriptionSubscription = await listener.subscribeToChannelSubscriptionEvents(userId, e => {
    const name = e.userDisplayName ?? e.userName;
    console.log(name, " subscribed!");
    broadcast({"type": "subscribe", "user": e.userName, "displayName": name});
});

const cheerSubscription = await listener.subscribeToChannelCheerEvents(userId, e => {
    const message = {"type": "cheer", "bits": e.bits}
    if (e.isAnonymous) {
        message["anonymous"] = true;
    } else {
        message["userName"] = e.userName;
        const name = e.userDisplayName ?? e.userName;
        message["diplayName"] = name;
    }
    console.log("Got cheer", message.bits, "from", message.anonymous ? "anonymous" : message.userName);
    broadcast(message);
});*/

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