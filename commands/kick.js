/*
!kick: Kicks mentioned user
Usage: "!kick <@user>"
*/

module.exports = {
    name: 'kick',
    description: 'Kicks mentioned user',
    guildOnly: true,
    adminOnly: true,
    args: true,
    execute(message, args) {
        // Get user to be kicked
        const taggedUser = message.mentions.members.first();

        // Notify of impeding doom
        message.channel.send(`${taggedUser}, you're outta here!`);
        
        // Attempt to kick user; if kick failed, log and notify
        taggedUser.kick().catch((reason) => {
            console.error(`Failed to kick ${taggedUser.user.username}. Reason: ${reason}`);
            message.channel.send('Failed to kick user.');
        });
    }
}