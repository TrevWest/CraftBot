/*
!kick: Kicks mentioned user

Usage: "!kick <@user>"
*/

const { help } = require('../cmd_help.json');

module.exports = {
    name: 'kick',
    help: help.kick,
    guildOnly: true,
    adminOnly: true,
    args: true,
    execute(message, args) {
        // Get user to be kicked
        const taggedUser = message.mentions.members.first();
        
        // Attempt to kick user; if kick failed, log and notify
        taggedUser.kick().then(() => {
            message.channel.send(`${taggedUser}, you're outta here!`);
        }).catch((reason) => {
            console.error(`Failed to kick ${taggedUser.user.username}. ${reason}`);
            message.channel.send('I cannot. They are too powerful.');
        });
    }
}