/*
Handles command cooldowns
Returns true if cooldown is active for message author
Returns false if cooldown is inactive for message author
*/

const Discord = require('discord.js');
const { prefix } = require('../config.json');

module.exports = {
    cooldownHandler(command, message) {
        const client = message.client;

        // Add entry in cooldowns for command if not present
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Discord.Collection());
        }

        // Store current timestamp
        const now = Date.now();
        // Fetch timestamp collection for command
        const timestamps = client.cooldowns.get(command.name);
        // Fetch command cooldown amount; default 3
        const cooldownAmount = (command.cooldown || 3) * 1000;

        // Check whether timestamp entry exists for message author
        if (timestamps.has(message.author.id)) {
            // Calculate expiration time
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            // If expiration time has not passed, inform user and return
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the '${prefix}${command.name}' command`);
                return true;
            }
        }

        // Update command timestamp collection and set self-delete
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        return false;
    }
}