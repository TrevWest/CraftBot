/*
!steam: Interfaces with members' steam libraries

Usage: "!steam [-c]"             : picks a shared steam game at random
       "!steam -l[c]"            : lists shared steam games
       "!steam -i <@user> <ID>"  : adds or updates mention's steam ID

Flags: -c [<@user1> ...]: Choose users. If no users mentioned, use all Craftbois.
       -l : List shared games.
*/

/*
Example url:
http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=[KEY]&steamid=[ID]&include_appinfo=true&format=json
*/

const { ENETUNREACH } = require('constants');
const Discord = require('discord.js');
const http = require('http');
const { steamKey } = require('../config.json');
const steamTools = require('../tools/steam_tools');

const validFlags = ['i', 'c', 'l'];

module.exports = {
    name: 'steam',
    description: 'Interfaces with members\' steam libraries',
    guildOnly: true, // server use only
    args: false,     // arguments not required
    usage: '!steam | !steam list | !steam update',
    cooldown: 1,     // 1 sec cooldown
    async execute(message, args) {
        var flags = [];
        var sharedGames; // Shared games list

        // Store flags in flags array
        if (args.length) {
            if (args[0].startsWith('-')) {
                flags = args.shift();
                flags = flags.slice(1).split('');
            }

            // Verify flags are valid
            for (const flag of flags) {
                if (!validFlags.includes(flag)) {
                    return message.reply(`'${flag}' is not a valid flag. Try again!`);
                }
            }
        }
 
        /*
        !steam -i <@user> <ID>
        Has two arguments, the first being the only mention
        */
        if (flags.includes('i') && message.mentions.users.size == 1 && args[0].startsWith('<@')) {
            // Blocks non-admins from use
            if (message.author.username != 'r1singphoenix') {
                return message.reply('you\'re not my dad.');
            }

            const ID = args[1];
            const user = messasge.mentions.users.first().username;

            // Update/add steam user list entry and write to steam.json
            message.client.steamUsers.set(user, ID);
            steamTools.write(message.client);
            
            // Rebuild master list
            await steamTools.updateMaster(message.client);
            
            // If user is active, update active user list and rebuild shared list
            if (client.activeUsers.has(user)) {
                client.activeUsers.set(user, ID);
                steamTools.updateSharedActive(messsage.client);
            }

            return message.channel.send(`Set ${mention.username}'s Steam ID: ${steamId}`);
        }

        // If -c flag set, get shared list for desired users
        if (flags.includes('c')) {
            var mentions = [];
            if (message.mentions.users.size) { // If users specified
                mentions = message.mentions.users.map(user => user.username);
            }

            sharedGames = steamTools.getChosenShared(message.client, mentions);

            // Remove mentions from args
            args = args.filter(arg => !arg.startsWith('<@'));

            // Remove -c flag from flags array
            flags.splice(flags.indexOf('c'), 1);
        }
        else { // Else use default active user shared list
            sharedGames = message.client.sharedList;
        }

        // If -l flag, list shared games
        if (flags.includes('l') && !args.length) {
            let data = [];

            // If client.activeUsers is empty
            if (!sharedGames.size) {
                data.push('It doesn\'t look like the Rabble have any games in common!');
                data.push('(Is anyone in voice chat?)');
                data.push('```Try running "!steam -cl" to list all Craftbois\' shared games.');
                data.push('Or, "steam -cl <@user1> ..." to include only specified Craftbois.```');

                return message.channel.send(data, { split: true });
            }

            data.push('Shared games:');
            data.push('```');

            sharedGames.each((owners, game) => {
                data.push(game);
            });

            data.push('```');

            message.channel.send(data);
        }

        // If no -l flag (should be no flags), pick random game from sharedGames
        else if (!flags.length && !args.length) {
            // If client.activeUsers is empty
            if (!sharedGames.size) {
                let data = [];
                
                data.push('It doesn\'t look like the Rabble have any games in common!');
                data.push('(Is anyone in voice chat?)');
                data.push('```Try running "!steam -c" to choose from all Craftbois\' shared games.');
                data.push('Or, "steam -c <@user1> ..." to include only specified Craftbois.```');

                return message.channel.send(data, { split: true });
            }
            
            // Pick random game
            const pick = sharedGames.randomKey();

            // Make suggestion
            return message.channel.send(`${pick}?`);
        }

        /*
        Invalid argument format
        */
        else {
            message.reply('!steam: I don\'t understand what you mean! (Invalid arguments)');
        }
    }
}