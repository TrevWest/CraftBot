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
     * @returns {Boolean} Returns true if valid Dirty Dan message
     */
    dirtyDan: (message) => {
        if (message.author.bot) return false;
        let regex = /i(s|m|'m|.*am).*dirt(y|iest).*dan( |$)/;
        if (message.content.toLowerCase().match(regex)) {
            message.channel.send('No, I\'m Dirty Dan');
            return true;
        }
        return false;
    },
    /**
     * Returns true if valid command, else returns false.
     * @param {string} commandName 
     */
    validCommand: (commandName, client) => {
        if (!client.commands.has(commandName)) {
            console.log(`Invalid command: ${commandName}`);
            message.reply('your command is bad and you should feel bad.');
            return false;
        }
        return true;
    },
    /**
     * Returns true if command usage is valid, else returns false.
     * @param {Object} command 
     * @param {Discord.Message} message 
     * @returns {Boolean}
     */
    validCommandUsage: (command, message) => {
        if (command.guildOnly && message.channel.type === 'dm') {
            message.reply('Command cannot be executed within DMs!');
            return false;
        }
        if (command.adminOnly && message.member.roles.cache.first().id != adminID) {
            message.reply('this command is admin-only');
            return false;
        }
        if (command.args && !args.length) {
            var reply = `The ${prefix}${commandName} command requires arguments.`;
            if (command.usage) {
                reply += `\nUsage: ${prefix}${command.name} ${command.usage}`;
            }
            message.channel.send(`\`\`\`\n${reply}\n\`\`\``);
            return false;
        }
        return true;
    },
    /**
     * Parses command
     * @param {String} commandName 
     * @param {Discord.Message} message 
     * @returns {Object} command
     */
    parseCmd: (commandName, message) => {
        let client = message.client;
        if (this.validCommand(commandName, client)) {
            return client.commands.get(commandName);
        }
        return null;
    }
}