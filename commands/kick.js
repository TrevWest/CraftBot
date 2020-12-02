/*
!kick: Kicks mentioned user
Usage: "!kick <@user>"
*/
module.exports = {
    name: 'kick',
    description: 'Kicks mentioned user',
    guildOnly: true,
    args: true,
    execute(message, args) {
        if (!message.mentions.users.size) {
            return message.reply('you want me to kick...no one?');
        }
        const taggedUser = message.mentions.users.first();

        message.channel.send(`${taggedUser}, you're outta here`);
    }
}