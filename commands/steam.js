/*
!steam: Interfaces with members' steam libraries
Usage: "!steam"                       : picks a shared steam game at random
       "!steam list"                  : lists members' shared steam games
       "!steam update"                : updates list of members' shared steam games
       "!steam -i <@user>"            : returns mention's steam ID
       "!steam -i <@user> <ID>"       : adds or updates mention's steam ID
*/

/*
Example url:
http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=[KEY]&steamid=[ID]&include_appinfo=true&format=json
*/

const { ENETUNREACH } = require('constants');
const Discord = require('discord.js');
const fs = require('fs');
const http = require('http');
const { steamKey } = require('../config.json');

module.exports = {
    name: 'steam',
    description: 'Interfaces with members\' steam libraries',
    guildOnly: true, // server use only
    args: false,     // arguments not required
    usage: '!steam | !steam list | !steam update',
    cooldown: 1,     // 1 sec cooldown
    async execute(message, args) {
        /*
        Reading steam.json from disk for each call to !steam
        is not ideal performance, but I'm accepting this tradeoff
        for the sake of code readability and convenience, and because
        steam.json is such a small amount of data for our use case that
        the performance hit should be(!) insignificant.
        */
        
        /*
        Remove steam.json from require.cache
        Allows changes to register after first call to !steam
        */
        delete require.cache[require.resolve('../steam.json')];
        steam = require('../steam.json');

        idCollection = new Discord.Collection();

        /*
        Took this approach for my own convenience, acknowledging
        that converting back and forth would result in a small
        performance hit.

        JSON.stringify() would not play nice with maps/collections.

        Ideal(ish) performance: perform operations with the array itself,
        C style, knowing that array[0] holds the discord user and array[1]
        holds the associated steam ID. Highly performant, mildly PITA.
        */

        // Map JSON array to idCollection
        for (const item of steam.IDs) {
            idCollection.set(item[0], item[1]);
        }

        function writeSteamJSON() {
            // Convert idCollection back to array
            _IDs = idCollection.map((val, key) => {
                return [key, val];
            });

            // JSON to be stored
            steamJSON = {
                IDs: _IDs,
                gamesInCommon: steam.gamesInCommon
            };

            // Write JSON to steam.json
            fs.writeFile('./steam.json', JSON.stringify(steamJSON, null, 4), (err) => {
                if (err) throw err;
            });

            console.log('!steam: steam.json updated');
        }

        /*
        !steam: picks a shared steam game at random
        No arguments
        */
        if (!args.length) {
            var numGames = steam.gamesInCommon.length;
            
            // If steam.gamesInCommon is empty
            if (numGames == 0) {
                message.channel.send('It doesn\'t look like you guys have any games in common!');
                message.channel.send('Try running "!steam update" then try again');
                return;
            }
            
            const pick = steam.gamesInCommon[Math.floor(Math.random() * numGames)];
            
            message.channel.send(`How about... ${pick}?`);
        }

        /*
        !steam list: lists members' shared steam games
        1 argument && args[0] === 'list'
        */
        else if (args.length == 1 && args[0] === 'list') {
            // If steam.gamesInCommon is empty
            if (steam.gamesInCommon.length == 0) {
                message.channel.send('It doesn\'t look like you guys have any games in common!');
                message.channel.send('Try running "!steam update" then try again');
                return;
            }
            
            var outputString = '\`\`\`';
            for (const game of steam.gamesInCommon) {
                outputString += `\n${game}`;
            }
            outputString += '\`\`\`';
            message.channel.send('Here are the games you have in common!');
            message.channel.send(outputString);
            message.channel.send('To update this list, run "!steam update"');
        }

        /*
        !steam update: updates list of members' shared games
        1 argument && args[0] === 'update'

        TODO: FORMATTING AND COMMENTS
        */
        else if (args.length == 1 && args[0] === 'update') {
            var gamesLists = [];
            var requestsComplete = 0;
            const numMembers = steam.IDs.length;

            /*
            Given an array of lists, returns the shortest list
            */
            function shortestList(lists) {
                var shortest = lists[0];

                for (item of lists) {
                    if (item.length < shortest.length) {
                        shortest = item;
                    }
                }

                return shortest;
            }

            /*
            Calculates intersection of lists in gamesLists
            and writes JSON to steam.json
            */
            function computeSharedGames() {
                var sharedList = shortestList(gamesLists);

                for (list of gamesLists) {
                    sharedList = sharedList.filter(x => list.includes(x));
                }

                steam.gamesInCommon = sharedList;
                writeSteamJSON();
                message.channel.send('Shared games list updated.');
            }

            /*
            Callback function for http requests
            */
            function callback(response) {
                var responseString = '';

                response.on('data', chunk => {
                    responseString += chunk;
                });

                response.on('end', () => {
                    var res = [];
                    try {
                        var resJSON = JSON.parse(responseString);
                    } catch (error) {
                        console.error('JSON failed to parse!');
                        console.error(error);
                        console.error('Bailing out. Try again maybe?');
                        return;
                    }
                    for (const game of resJSON.response.games) {
                        res.push(game.name);
                    }
                    gamesLists.push(res);
                    ++requestsComplete;
                    if (requestsComplete == numMembers) {
                        computeSharedGames();
                    }
                });
            }

            /*
            For each server member, send GET request for steam library,
            and call callback function to handle responses
            */
            for (const ID of idCollection) {
                var options = {
                    host: 'api.steampowered.com',
                    path: `/IPlayerService/GetOwnedGames/v0001/?key=${steamKey}&steamid=${ID[1]}&include_appinfo=true&format=json`
                };

                try {
                    http.get(options, callback);
                } catch (error) {
                    console.error(error);
                }
            }
        }

        /*
        !steam -i <@user>: sends steam ID of mentioned user
        Has two arguments, first argument is '-i', and one mention
        */
        else if (args.length == 2 && args[0] === '-i' && message.mentions.users.size == 1) {
            // Blocks non-admins from use
            if (message.author.username != 'r1singphoenix') {
                return message.reply('you\'re not my dad.');
            }
            
            let mention = message.mentions.users.first();

            if (!idCollection.has(mention.username)) {
                return message.channel.send(`I don't know ${mention.username}'s steam ID!`);
            }

            let steamId = idCollection.get(mention.username);
            message.channel.send(`${mention.username}'s steam ID: ${steamId}`);
        }

        /*
        !steam -i <@user> <ID>: adds or updates mentioned user's steam ID
        Has three arguments, the first argument is '-i', the second is a mention,
        and it is the only mention
        */
        else if (args.length == 3 && args[0] === '-i' && args[1].startsWith('<@') && message.mentions.users.size == 1) {
            // Blocks non-admins from use
            if (message.author.username != 'r1singphoenix') {
                return message.reply('you\'re not my dad.');
            }

            let steamId = args[2];
            let mention = message.mentions.users.first();
            idCollection.set(mention.username, steamId);

            writeSteamJSON();

            message.channel.send(`Set ${mention.username}'s Steam ID: ${steamId}`);
        }

        /*
        Invalid argument format
        */
        else {
            message.reply('!steam: I don\'t understand what you mean! (Invalid arguments)');
        }
    }
}