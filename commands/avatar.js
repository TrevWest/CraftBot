/*
!avatar: Returns avatar URL(s)
Usage: "!avatar"                      : Send user's avatar
       "!avatar <@user> <@user2> ..." : Send avatar of tagged user(s)
*/
module.exports = {
    name: 'avatar',
    description: 'Returns avatar URL(s) for specified user(s), or avatar of command issuer if no users are specified',
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