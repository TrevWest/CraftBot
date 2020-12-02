/*    
 ________  ________  ________  ________ _________  ________  ________  _________   
|\   ____\|\   __  \|\   __  \|\  _____\\___   ___\\   __  \|\   __  \|\___   ___\ 
\ \  \___|\ \  \|\  \ \  \|\  \ \  \__/\|___ \  \_\ \  \|\ /\ \  \|\  \|___ \  \_| 
 \ \  \    \ \   _  _\ \   __  \ \   __\    \ \  \ \ \   __  \ \  \\\  \   \ \  \  
  \ \  \____\ \  \\  \\ \  \ \  \ \  \_|     \ \  \ \ \  \|\  \ \  \\\  \   \ \  \ 
   \ \_______\ \__\\ _\\ \__\ \__\ \__\       \ \__\ \ \_______\ \_______\   \ \__\
    \|_______|\|__|\|__|\|__|\|__|\|__|        \|__|  \|_______|\|_______|    \|__|


             Created by Trevor Westergard for OG Craftbois Discord Server
*/

/* TODO MAIN:
Audio files played through voice chat on command/action
Media files posted on command/action
*/

/* TODO SIDE:
Make git exceptions for real .json files BEFORE first commit
Regex for "i'm [any word(s)] dirty [any word(s)] dan
Flesh out console logging (log after each action, etc.)
Better admin-only functionality
Expand argument checking (min, max, types)
Better "usage" implementation in !help
*/

/*
Command property list ('+' indicates an optional property):

name <string>          : command name
+description <string>  : brief description; used in !help
+guildOnly <bool>      : determines if command is guild-only
+args <bool>           : determines if command requires arguments
+usage <string>        : shows correct usage
+cooldown <int>        : command cooldown time (per user) in seconds
*/

const fs = require('fs');
const Discord = require('discord.js');
const { prefix, commandDir, token } = require('./config.json');

// Create client object with specified gateway intents
const { Client } = require('discord.js');
const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_PRESENCES', 'GUILD_MESSAGES'] } });

// Create command collection within client
client.commands = new Discord.Collection();

// Create array of all .js files located in ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Map command files to command names in client.commands
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Command cooldowns
const cooldowns = new Discord.Collection();

client.once('ready', () => {
	console.log('Ready');
});

// Command handler
client.on('message', message => {

    // Which one of you fellers is the REAL Dirty Dan
    if (message.content.toLowerCase().includes('i\'m dirty dan') && !message.author.bot) {
        message.channel.send('No, I\'m Dirty Dan');
    }

    // Ignore normal messages, and those sent by bots
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Store command and arguments from message.content
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Invalid command
    if (!client.commands.has(commandName)) {
        return message.reply('your command is bad and you should feel bad.');
    }

    const command = client.commands.get(commandName);

    // Check if command is guild-only
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('Command cannot be executed within DMs!');
    }

    // Command requires arguments but no arguments given
    if (command.args && !args.length) {
        let reply = `The ${prefix}${commandName} command requires arguments.`;

        if (command.usage) {
            reply += `\nUsage: ${prefix}${command.name} ${command.usage}`;
        }

        return message.channel.send(`\`\`\`\n${reply}\n\`\`\``);
    }

    // Add entry in cooldowns for command if not present
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    // Store current timestamp
    const now = Date.now();
    // Fetch timestamp collection for command
    const timestamps = cooldowns.get(command.name);
    // Fetch command cooldown amount; default 3
    const cooldownAmount = (command.cooldown || 3) * 1000;

    // Check whether timestamp entry exists for message author
    if (timestamps.has(message.author.id)) {
        // Calculate expiration time
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        // If expiration time has not passed, inform user and return
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the '${prefix}${command.name}' command`);
        }
    }

    // Update command timestamp collection and set self-delete
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Execute command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.channel.send('Bot machine broke. No refunds.');
    }

});

/*
Dynamic real-time command reloading

When a command file is updated, it is automatically removed from 
require.cache and reloaded into CraftBot, while craftbot is still 
running. This allows for quick, real-time changes to CraftBot, 
without the need to restart it or type in any commands.
*/
let fsWait = false;
fs.watch(commandDir, (event, filename) => {
    // If no filename returned, or file rename, do nothing
    // (If commands are being renamed CraftBot _probably_ shouldn't be running anyway)
    if (filename && event === 'change') {
        /*
        Debounce function. Prevents command from being
        reloaded multiple times per file change.
        */
        if (fsWait) return;
        fsWait = setTimeout(() => {
            fsWait = false;
        }, 100);

        console.log(`File change detected in ./commands: ${filename}`);

        // Remove file from require cache
        delete require.cache[require.resolve(`./commands/${filename}`)];

        // Reload command into client.commands
        try {
            const command = require(`./commands/${filename}`);
            client.commands.set(command.name, command);
            console.log(`Successfully reloaded ${filename}`);
        } catch (error) {
            console.error(`Could not reload ${filename}`);
            console.error(error);
        }
    }
});

client.login(token);

/*
        .--'''''''''--.
     .'      .---.      '.
    /    .-----------.    \
   /        .-----.        \
   |       .-.   .-.       |
   |      /   \ /   \      |
    \    | .-. | .-. |    /
     '-._| | | | | | |_.-'
         | '-' | '-' |
          \___/ \___/
       _.-'  /   \  `-._
     .' _.--|     |--._ '.
     ' _...-|     |-..._ '
            |     |
            '.___.'
              | |
             _| |_
            /\( )/\
           /  ` '  \
          | |     | |
          '-'     '-'
          | |     | |
          | |     | |
          | |-----| |
       .`/  |     | |/`.
       |    |     |    |
       '._.'| .-. |'._.'
             \ | /
             | | |
             | | |
             | | |
            /| | |\
          .'_| | |_`.
          `. | | | .'
       .    /  |  \    .
      /o`.-'  / \  `-.`o\
     /o  o\ .'   `. /o  o\
     `.___.'       `.___.'
*/