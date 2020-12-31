/*
!help: Dynamic help command

Usage: "!help"           : Send list of commands
       "!help <command>" : Send info on specified command
*/

const { prefix } = require('../config.json');
const { help } = require('../cmd_help.json');

module.exports = {
    name: 'help',
    help: help.help,
    guildOnly: false,
    args: false,
    execute(message, args) {
        const data = [];
        const { commands } = message.client;

        /*
        !help : sends list of commands
        Could implement direct DM functionality, but doesn't
        seem necessary for OG Craftbois
        */
        if (!args.length) {
            data.push('Here\'s a list of all my commands:');
            data.push('```' + commands.map(command => command.name).join(', ') + '```');
            data.push(`Use '${prefix}help <command>' to get info on a specific command.`);

            // { split: true } sends each line on a new line
            return message.channel.send(data, { split: true });
        }

        /*
        !help <command> : sends info on specified command
        */

        const name = args[0].toLowerCase();
        const command = commands.get(name);

        // If command does not exist, end
        if (!command) {
            return message.reply(`${name} is not a valid command name!`);
        }

        // Compile command info
        data.push('```');
        for (line of command.help) data.push(line);
        data.push(`\nCooldown: ${command.cooldown || 3} sec`);
        data.push('```');

        // Send information
        message.channel.send(data, { split: true });
    }
}