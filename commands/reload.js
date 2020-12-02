/*
!reload: reloads specified command
Usage: "!reload <command>"
*/

/*
DELETE THIS NEPHEW

Implementing in index.js
*/

module.exports = {
    name: 'reload',
    description: 'Reloads a command',
    guildOnly: false,
    args: true,
    execute(message, args) {
        // Prevents non-admin use
        if (message.author.username != 'r1singphoenix') {
            return message.channel.send('You\'re not my dad!');
        }

        // Fetch command from command list
        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName);

        if (!command) return message.channel.send('Command not found');

        // Remove command from require cache
        delete require.cache[require.resolve(`./${command.name}.js`)];

        // Reload command
        try {
            const newCommand = require(`./${command.name}.js`);
            message.client.commands.set(newCommand.name, newCommand);
        } catch (error) {
            console.error(error);
            message.channel.send(`Failed to reload command ${command.name}`);
        }
    }
}