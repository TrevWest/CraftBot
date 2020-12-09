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
Console command handling
Audio files played through voice chat on command/action
Media files posted on command/action
*/

/* TODO SIDE:
Better logging of info on guild members & command message authors
Regex for "i'm [any word(s)] dirty [any word(s)] dan
Better admin-only functionality (admin list, partial command restrictions)
Expand argument checking (min, max, types)
Better "usage" implementation in !help
Move cooldown list from client to cooldown.js(?)
*/

/*
Command property list ('+' indicates an optional property):

name <string>          : command name
+description <string>  : brief description; used in !help
+guildOnly <bool>      : determines if command is guild-only
+adminOnly <bool>      : determines if command is admin-only
+args <bool>           : determines if command requires arguments
+usage <string>        : shows correct usage
+cooldown <int>        : command cooldown time (per user) in seconds
*/

const fs = require('fs');
const Discord = require('discord.js');
const { prefix, commandDir, consoleCmdDir, token, adminID } = require('./config.json');

const cooldowns = require('./tools/cooldown.js'); // Cooldown handler tool

// Create client object with specified gateway intents
const { Client } = require('discord.js');
const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_PRESENCES', 'GUILD_MESSAGES'] } });

// Create command collection within client
client.commands = new Discord.Collection();

// Create array of all .js files located in ./commands
const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));

// Map command files to command names in client.commands
for (const file of commandFiles) {
    const command = require(`${commandDir}/${file}`);
    client.commands.set(command.name, command);
}

// Create command cooldown collection within client
client.cooldowns = new Discord.Collection();

// On client ready
client.once('ready', () => {
    //.. get guild/member info
    

    // Set status online
    client.user.setStatus('online')
        .then(console.log)
        .catch(console.error);
    
    // Log bot info
    client.user.fetch()
        .then(console.log)
        .catch(console.error);
    
    setTimeout(() => {console.log('\nClient ready\n')}, 100);
});

/*
Discord command handler

For commands sent through Discord servers
*/
client.on('message', message => {

    // Which one of you fellers is the REAL Dirty Dan
    if (message.content.toLowerCase().includes('i\'m dirty dan') && !message.author.bot) {
        message.channel.send('No, I\'m Dirty Dan');
    }

    // Ignore normal messages, and those sent by bots
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Store command and arguments from message.content
    let args = message.content.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();

    // Invalid command
    if (!client.commands.has(commandName)) {
        console.log(`Invalid command: ${commandName}`);
        return message.reply('your command is bad and you should feel bad.');
    }

    // Load command
    const command = client.commands.get(commandName);

    // Check if command is guild-only
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('Command cannot be executed within DMs!');
    }

    // Admin-only
    if (command.adminOnly && message.member.roles.cache.first().id != adminID) {
        return message.reply('this command is admin-only');
    }

    // Command requires arguments but no arguments given
    if (command.args && !args.length) {
        var reply = `The ${prefix}${commandName} command requires arguments.`;

        if (command.usage) {
            reply += `\nUsage: ${prefix}${command.name} ${command.usage}`;
        }

        return message.channel.send(`\`\`\`\n${reply}\n\`\`\``);
    }

    /*
    Cooldown handler

    Returns TRUE if cooldown is active for message author
    Returns FALSE if cooldown is inactive for message author
    */
    if (cooldowns.handler(command, message)) return;

    // Execute command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.channel.send('Bot machine broke. No refunds.');
    }
});

// Create console command collection in client
client.consoleCommands = new Discord.Collection();

// Store commands in client.consoleCommands collection
const consoleCmdFiles = fs.readdirSync(consoleCmdDir).filter(file => file.endsWith('.js'));
for (const file of consoleCmdFiles) {
    const command = require(`${consoleCmdDir}/${file}`);
    client.consoleCommands.set(command.name, command);
}

/*
Console command handler

Allows for back-end interaction with CraftBot
*/
const readline = require('readline');
const consoleIO = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

consoleIO.on('line', (input) => {
    // Store command and args
    let args = input.trim().split(/ +/);
    let commandName = args.shift();

    // Verify valid command
    if (!client.consoleCommands.has(commandName)) {
        return console.log(`Invalid command: ${commandName}`);
    }

    // Load command
    const command = client.consoleCommands.get(commandName);

    // Execute
    try {
        command.execute(args);
    } catch (error) {
        console.log(error);
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

        console.log(`File change detected in ${commandDir}: ${filename}`);

        // Remove file from require cache
        delete require.cache[require.resolve(`${commandDir}/${filename}`)];

        // Reload command into client.commands
        try {
            const command = require(`${commandDir}/${filename}`);
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