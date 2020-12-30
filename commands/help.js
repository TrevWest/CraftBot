/*
!help: Dynamic help command
Usage: "!help"             : Send list of commands
       "!help <command>"   : Send info on specified command
*/

const { prefix } = require('../config.json');

module.exports = {
    name: 'help',
    description: 'List all commands or give info about a specific command.',
    guildOnly: false,
    args: false,
    usage: '<command name>',
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
            data.push('    ' + commands.map(command => command.name).join(', '));
            data.push(`\nUse '${prefix}help ${this.usage}' to get info on a specific command`);

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
        data.push(`Name: ${command.name}`);
        if (command.description) data.push(`Description: ${command.description}`);
        if (command.usage) data.push(`Usage: ${command.usage}`);
        data.push(`Cooldown: ${command.cooldown || 3} seconds`);

        // Send information
        message.channel.send(data, { split: true });
    }
}