/*
!avatar: Returns avatar URL(s)

Usage: "!avatar"              : Send user's avatar
       "!avatar <@user1> ..." : Send avatar of tagged user(s)
*/

const { help } = require('../cmd_help.json');

module.exports = {
    name: 'avatar',
    help: help.avatar,
    guildOnly: false,
    args: false,
    execute(message, args) {
        // "!avatar"
        if (!message.mentions.users.size) {
            return message.channel.send(`Your avatar: <${message.author.displayAvatarURL({ format: "png", dynamic: true })}>`);
        }

        // "!avatar @user @user2 ..."
        // Use map() to create list
        const avatarList = message.mentions.users.map(user => {
            return `${user.username}'s avatar: <${user.displayAvatarURL({ format: "png", dynamic: true })}>`;
        });

        message.channel.send(avatarList);
    }
}