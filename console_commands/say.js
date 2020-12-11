/*
say: sends a message as CraftBot

Usage: "say <message>"                 : Sends message in #general
       "say -c <channel> <message>"    : Sends message in specified channel
*/

const { DiscordAPIError } = require("discord.js");

const Discord = require('discord.js');

module.exports = {
    name: 'say',
    execute(client, args) {
        // Default to general chat if no channel specified
        var sendChannel = client.craftChannels.get('general');

        // If -c flag, set specified channel
        if (args[0] === '-c') {
            args.shift(); // Remove flag
            
            const channelName = args.shift(); // Pop channel name
            sendChannel = client.craftChannels.get(channelName);
        }

        // If no message, don't try to send
        if (!args) return;

        // Message to send
        const message = args.join(' ');

        // Send message
        sendChannel.send(message);
    }
}