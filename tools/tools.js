/*
General-purpose tools for craftbot
*/

const Discord = require('discord.js');
const { voiceChannel } = require('../config.json');

module.exports = {
    /**
     * Adds or removes user from client.activeUsers
     * @param {Discord.Client} client 
     * @param {Discord.VoiceState} newState 
     */
    // (Should have already validated that voice state change was join/leave before calling)
    updateActiveUsers: (client, newState) => {
        // Get active user channel (defined in config.json)
        const activeUserChannel = client.guilds.cache.first().channels.cache.find(channel => channel.name === voiceChannel);
        const username = newState.member.user.username;

        // If joined channel, add to client.activeUsers
        if (newState.channel == activeUserChannel) {
            client.activeUsers.set(username, client.steamUsers.get(username));
        }

        // If left channel, remove from client.activeUsers
        else {
            client.activeUsers.delete(username);
        }
    }
}