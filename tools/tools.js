/* Tools for craftbot */

const Discord = require('discord.js');
const { voiceChannel } = require('../config.json');
const { cooldownHandler } = require('./cooldown.js');

/**
     * Updates client.activeUsers
     * @param {Discord.Client} client 
     * @param {Discord.VoiceState} newState 
     */
const updateActiveUsers = (client) => {
    const activeUserChannel = client.server.channels.cache.find(channel => channel.name === voiceChannel);
    const activeUsers = new Set();

    activeUserChannel.members.each(member => {
        activeUsers.add(member.user.username);
    });
    client.activeUsers = client.steamUsers.filter((ID, username) => {
        return activeUsers.has(username);
    });
}

/**
 * No, I'm Dirty Dan.
 * @param {Discord.Message} message 
 * @returns {Boolean} Returns true if valid Dirty Dan message
 */
const dirtyDan = (message) => {
    if (message.author.bot) return false;
    let regex = /i(s|m|'m|.*am).*dirt(y|iest).*dan( |$)/;
    if (message.content.toLowerCase().match(regex)) {
        message.channel.send('No, I\'m Dirty Dan');
        return true;
    } else {
        return false;
    }
}

/**
 * Returns true if valid command, else returns false.
 * @param {string} commandName 
 */
const validCommand = (commandName, client) => {
    if (!client.commands.has(commandName)) {
        console.log(`Invalid command: ${commandName}`);
        message.reply('your command is bad and you should feel bad.');
        return false;
    } else {
        return true;
    }
}

/**
 * Returns true if command usage is valid, else returns false.
 * @param {Object} command 
 * @param {Discord.Message} message 
 * @returns {Boolean}
 */
const validCommandUsage = (command, message, args) => {
    let isValid = true;
    if (command.guildOnly && message.channel.type === 'dm') {
        message.reply('Command cannot be executed within DMs!');
        isValid = false;
    }
    else if (command.adminOnly && message.member.roles.cache.first().id != adminID) {
        message.reply('this command is admin-only');
        isValid = false;
    }
    else if (command.args && !args.length) {
        var reply = `The ${prefix}${commandName} command requires arguments.`;
        if (command.usage) {
            reply += `\nUsage: ${prefix}${command.name} ${command.usage}`;
        }
        message.channel.send(`\`\`\`\n${reply}\n\`\`\``);
        isValid = false;
    }
    return isValid;
}

/**
 * Parses command
 * @param {String} commandName 
 * @param {Discord.Message} message 
 * @returns {Object} command
 */
const parseCmd = (commandName, message) => {
    let client = message.client;
    if (validCommand(commandName, client)) {
        return client.commands.get(commandName);
    } else {
        return null;
    }
}

/**
 * Executes command if valid usage and no cooldown active
 * @param {Object} command 
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
const execute = (command, message, args) => {
    if (!validCommandUsage(command, message, args)) {
        return;
    }
    if (cooldownHandler(command, message)) {
        return;
    }
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.channel.send('Bot machine broke. No refunds.');
    }
}

module.exports = {
    updateActiveUsers: updateActiveUsers,
    dirtyDan: dirtyDan,
    validCommand: validCommand,
    validCommandUsage: validCommandUsage,
    parseCmd: parseCmd,
    execute: execute
}