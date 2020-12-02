/*
!server: Returns server information
Usage: "!server"
*/
module.exports = {
    name: 'server',
    description: 'Returns basic server information',
    guildOnly: true,
    args: false,
    execute(message, args) {
        message.channel.send(`\`\`\`\nServer: ${message.guild.name}\nCraftboi Count: ${message.guild.memberCount - 1}\nEstablished: ${message.guild.createdAt}\nRegion: ${message.guild.region}\n\`\`\``);
    }
}