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

        var idCollection = new Discord.Collection();

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
                console.log('!steam: steam.json updated');
            });
        }

        /*
        !steam: picks a shared steam game at random
        No arguments
        */
        if (!args.length) {
            var numGames = steam.gamesInCommon.length;
            
            // If steam.gamesInCommon is empty
            if (numGames == 0) {
                let data = [];
                
                data.push('It doesn\'t look like you guys have any games in common!');
                data.push('Try running "!steam update" then try again');

                return message.channel.send(data, { split: true });
            }
            
            // Randomly select game from list
            const pick = steam.gamesInCommon[Math.floor(Math.random() * numGames)];
            
            // Make suggestion
            return message.channel.send(`How about... ${pick}?`);
        }

        /*
        !steam list: lists members' shared steam games
        1 argument && args[0] === 'list'
        */
        else if (args.length == 1 && args[0] === 'list') {
            // If steam.gamesInCommon is empty
            if (steam.gamesInCommon.length == 0) {
                let data = [];
                
                data.push('It doesn\'t look like you guys have any games in common!');
                data.push('Try running "!steam update" then try again');
                
                return message.channel.send(data, { split: true });
            }
            
            // Output data
            let data = [];
            
            // Compile game list
            var outputString = '\`\`\`';
            outputString += steam.gamesInCommon.join('\n');
            outputString += '\`\`\`';

            // Prepare output data
            data.push('Here are the games you have in common:');
            data.push(outputString);
            data.push('To update this list, run "!steam update"');

            // Send list
            return message.channel.send(data);
        }

        /*
        !steam update: updates list of members' shared games
        1 argument && args[0] === 'update'

        TODO: FORMATTING AND COMMENTS
        */
        else if (args.length == 1 && args[0] === 'update') {
            var gamesLists = []; // Holds each guild member's list of owned games
            var requestsComplete = 0; // Tracks number of HTTP requests completed
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
                // Start with smallest list for optimal time
                var sharedList = shortestList(gamesLists);

                // Determine shared games using array intersection
                for (list of gamesLists) {
                    sharedList = sharedList.filter(x => list.includes(x));
                }
                steam.gamesInCommon = sharedList;

                writeSteamJSON();
                message.channel.send('Shared games list updated.');
            }

            /*
            Callback function for http requests
            Called once per user in steam.IDs
            */
            function callback(response) {
                var responseString = '';

                // Add data chunk to response string
                response.on('data', chunk => {
                    responseString += chunk;
                });

                // Called once data has finished being received
                response.on('end', () => {
                    var res = [];
                    
                    // Parse received JSON
                    try {
                        var resJSON = JSON.parse(responseString);
                    } catch (error) {
                        console.error('JSON failed to parse!');
                        console.error(error);
                        console.error('Bailing out. Try again maybe?');
                        return;
                    }

                    // Extract game titles and place into array
                    for (const game of resJSON.response.games) {
                        res.push(game.name);
                    }
                    // Add to gamesLists
                    gamesLists.push(res);

                    // Track number of complete requests
                    ++requestsComplete;
                    if (requestsComplete == numMembers) {
                        computeSharedGames(); // Calls after last request completes
                    }
                });
            }

            /*
            For each server member, send GET request for steam library,
            and call callback function to handle responses
            */
            for (const ID of idCollection) {
                // Set http request options
                var options = {
                    host: 'api.steampowered.com',
                    path: `/IPlayerService/GetOwnedGames/v0001/?key=${steamKey}&steamid=${ID[1]}&include_appinfo=true&format=json`
                };

                // Execute asynchronous requests
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
            
            // Get specified user
            let mention = message.mentions.users.first();

            // Check that user is known by CraftBot
            if (!idCollection.has(mention.username)) {
                return message.channel.send(`I don't know ${mention.username}'s steam ID!`);
            }

            // Fetch steam ID and send in message channel
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

            // Get mentioned user and steam ID value
            let steamId = args[2];
            let mention = message.mentions.users.first();

            // Add collection entry and write to steam.json
            idCollection.set(mention.username, steamId);
            writeSteamJSON();

            // Notify of task completion
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