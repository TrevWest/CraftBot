/* Tools for craftbot */

const Discord = require('discord.js');
const { voiceChannel } = require('../config.json');

module.exports = {
    /**
     * Updates client.activeUsers
     * @param {Discord.Client} client 
     * @param {Discord.VoiceState} newState 
     */
    updateActiveUsers: (client) => {
        const activeUserChannel = client.server.channels.cache.find(channel => channel.name === voiceChannel);
        const activeUsers = new Set();
        
        activeUserChannel.members.each(member => {
            activeUsers.add(member.user.username);
        });
        client.activeUsers = client.steamUsers.filter((ID, username) => {
            return activeUsers.has(username);
        });
    },
    /**
     * No, I'm Dirty Dan.
     * @param {Discord.Message} message 
     * @returns {boolean} Returns true if valid Dirty Dan message
     */
    dirtyDan: (message) => {
        if (message.author.bot) return false;
        let regex = /i(s|m|'m|.*am).*dirt(y|iest).*dan( |$)/;
        if (message.content.toLowerCase().match(regex)) {
            message.channel.send('No, I\'m Dirty Dan');
            return true;
        }
        return false;
    }
}