/*
General-purpose tools for craftbot
*/

const Discord = require('discord.js');
const { voiceChannel } = require('../config.json');

module.exports = {
    /**
     * Updates client.activeUsers
     * @param {Discord.Client} client 
     * @param {Discord.VoiceState} newState 
     */
    // (Should have already validated that voice state change was join/leave before calling)
    updateActiveUsers: (client) => {
        // Get active user channel (defined in config.json)
        const activeUserChannel = client.server.channels.cache.find(channel => channel.name === voiceChannel);
        var activeUsers = [];
        
        // Get usernames of members in voice channel
        activeUserChannel.members.array().forEach(member => {
            activeUsers.push(member.user.username);
        });
                
        // Set client.activeUsers
        client.activeUsers = client.steamUsers.filter((ID, username) => {
            return activeUsers.includes(username);
        });
    }
}