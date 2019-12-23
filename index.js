// Get the plugins
const Discord = require('discord.js');
const bot = new Discord.Client();
const db = require('quick.db');
const fs = require('fs');
const util = require('util');
global.clc = require('cli-color');
const tools = require('./functions/generalFunctions.js');
const gdtools = require('./functions/gdFunctions.js');

// https://discordapp.com/oauth2/authorize?client_id=651633944638521384&scope=bot&permissions=8

// Constants
global.regData = {
	gameVersion: '21',
	binaryVersion: '35',
	secret: 'Wmfd2893gb7',
};

global.cTrusted = clc.yellow; // Yellow - Trusted has run a trusted command
global.cLoadFile = clc.magenta; // Magenta - Loading file
global.cLoadFileName = clc.magentaBright.bold; // MagentaBright - Loading file +filename
global.cLoadSucc = clc.green; // Green - Loading success
global.cLoadSuccInfo = clc.greenBright.bold; // BrightGreen - Loading success +information
global.cLoadSuccTime = clc.blue.bold; // Blue - Loading success +time

global.cErr = clc.cyan; // Cyan - Error
global.cErrInfo = clc.cyanBright.bold; // CyanBright - Error +information
global.cErrMsg = clc.red; // Red - Error +message
global.cErrUnhandled = clc.redBright.bold; // RedBright - UnhandledError
global.cErrUnhandledMsg = clc.yellowBright.bold; // YellowBright - UnhandledError +message
global.cTest = clc.blackBright.bold; // BlueBright - Testing

// Startup variables
global.config = JSON.parse(fs.readFileSync('config.json'));
async function asyncFunc() {
	let fplayers = (await db.get(`players`)) || [[]];
	global.playersByPID = new Discord.Collection(fplayers);
	global.playersByUID = new Discord.Collection();
	for (const v of fplayers) playersByUID.set(v[1], v[0]);

	global.announceChannels = new Discord.Collection((await db.get(`announceChannel`)) || [[]]);

	global.botUpdates = new Discord.Collection((await db.get(`botUpdates`)) || [[]]);
	global.admin = new Discord.Collection((await db.get(`adminRoles`)) || [[]]);
	// guildID, rated, timed
	global.pingRole = new Discord.Collection((await db.get(`pingRoles`)) || [[]]);
	// userId, Description
	global.userDescription = new Discord.Collection((await db.get(`userDescription`)) || [[]]);

	if (!fs.existsSync('./login.txt')) {
		let account = await gdtools.idAndUn(config.accountName);
		fs.writeFileSync('./login.txt', `{"accountId": "${account[1]}","password": "${xor.encrypt(config.accountPass, 37526)}"}`);
	}
}
asyncFunc();
global.loginData = JSON.parse(fs.readFileSync('./login.txt'));
const token = config.discord;
global.NAME = config.name;
global.VERSION = config.version;

// Default settings.
global.prefix = config.prefix;
global.adminrole = [];
global.usedcmd = new Set();
global.linkAccMap = new Discord.Collection();
// Create maps of players listed by their GDID and their UserID

//command system   THANK YOU SPUTNIX FOR THIS
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
let longest = 0;
for (const file of commandFiles) {
	if (file.length > longest) longest = file.length;
}
for (const file of commandFiles) {
	let loading = file;
	for (i = 0; i < longest; i++) {
		loading += ' ';
		if (loading.length >= longest + 1) break;
	}
	console.log(cLoadFile(`Command `) + cLoadFileName(loading) + cLoadFile(`loading...`));
	const commande = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	for (const n of commande.config.command) {
		bot.commands.set(n, commande);
	}
}
console.log(cLoadSucc(`Loaded `) + cLoadSuccInfo(commandFiles.length) + cLoadSucc(` commands and `) + cLoadSuccInfo(bot.commands.array().length) + cLoadSucc(` aliases!`));

// Whenever the bot is added to a server
bot.on('guildCreate', async guild => {
	console.log(cLoadSucc(`Joined guild ${guild.name}! It has ${guild.members.size} members and ${guild.channels.size} channels! ID: ${guild.id}`));
	let channelID;
	let channels = guild.channels;
	channelLoop: for (let c of channels) {
		let channelType = c[1].type;
		if (channelType === 'text') {
			channelID = c[0];
			break channelLoop;
		}
	}

	//   Prefix
	let fprefixgc = await db.fetch(`prefix_${guild.id}`);
	if (fprefixgc === null) prefix = config.prefix;
	else prefix = fprefixgc;

	let channel = bot.channels.get(guild.systemChannelID || channelID);
	channel.send(`Thank you for inviting ${NAME} to the server!\nTo view all the commands, use \`${config.prefix}help\``);
});

// WHEN THE BOT IS ONLINE
bot.on('ready', async () => {
	if (displayServersOnLaunch) bot.guilds.forEach(async (g, key) => console.log(cTrusted(key) + ` - ` + cLoadSuccTime(await tools.toLength(` ${g.name} `, 30, 'center', '.')) + ` - ` + cErr(g.memberCount)));
	bot.user.setActivity(config.playingStatus);
	console.log(cLoadSuccInfo('ONLINE'));

	console.log(cLoadSuccTime(`${await tools.timeFormatted()}   -   `) + cLoadSucc(`Bot has started, with `) + cLoadSuccInfo(bot.users.size) + cLoadSucc(` users, in `) + cLoadSuccInfo(bot.channels.size) + cLoadSucc(` channels of `) + cLoadSuccInfo(bot.guilds.size) + cLoadSucc(` guilds.`));
});

// WHEN A MESSAGE IS SENT IN A GUILD
bot.on('message', async message => {
	if (message.channel.name == undefined || message.author.bot == true) return;
	commands(message);
});
// Command system
async function commands(message) {
	//   Prefix
	let prefix = /*(await db.fetch(`prefix_${message.guild.id}`)) || */ config.prefix;

	if (message.content === 'getprefix') return message.channel.send(`The current ${NAME} prefix is \`${prefix}\``); // If the user wants the prefix, give it to them dammit!
	if (!message.content.startsWith(prefix)) return; // If message didn't start with the prefix or was sent by a bot, dont run next code
	// If they aren't in a premium guild or arent a premium member
	if (usedcmd.has(message.author.id)) return message.reply('please wait before using a command again!'); // Check if they have used a command recently, return error if they have
	if (!config.ownerId.includes(message.member.id)) usedcmd.add(message.author.id); // If they havent used one recently, add them to recent list
	setTimeout(() => usedcmd.delete(message.author.id), config.commandCooldown * 1000); // After x seconds remove them.

	// Create arguments
	const args = message.content.substring(prefix.length).split(' '); // Create arguments array by cutting off the prefix then seperating the arguments into indexes by spaces
	var cmd = bot.commands.get(args[0].toLowerCase()); // Set cmd to the command to run it later
	if (!cmd) return; // If it isnt a command, just return

	let adminrole = admin.get(message.guild.id) || [];

	// Set message variables.
	global.hasAdmin = message.member.roles.find(role => adminrole.includes(role.id));
	if (cmd.config.permlvl == 'Admin' && !hasAdmin && message.author.id != message.guild.ownerID && !config.ownerId.includes(message.member.id)) return tools.errPerm(message, 1);
	if ((cmd.config.permlvl == 'BotOwner' || cmd.config.permlvl == 'DISABLED') && !config.ownerId.includes(message.member.id)) return tools.errPerm(message, 2);
	// Run the command
	cmd.run(bot, message, args);
}

process.on('uncaughtException', async (err, origin) => {
	console.log(cErrUnhandled(`Uncaught Exception occured -\n${err}`));
	console.log(cErrUnhandledMsg(`Origin at - ${util.inspect(origin, true, null, false)}`));
	if (!fs.existsSync('./errors')) fs.mkdirSync('./errors');
	fs.writeFileSync(`./errors/${await tools.timeFormatted()}.txt`, `Uncaught Exception occured -\n${err}\nOrigin at - ${util.inspect(origin, true, null, false)}`);
});

process.on('unhandledRejection', async (reason, promise) => {
	console.log(cErrUnhandled(`Unhandled promise occured\n-- ${reason}\n`));
	console.log(cErrUnhandledMsg(`Origin at - ${util.inspect(promise, true, null, false)}`));
	if (!fs.existsSync('./errors')) fs.mkdirSync('./errors');
	fs.writeFileSync(`./errors/${await tools.timeFormatted()}.txt`, `Unhandled promise occured\n-- ${reason}\n\nOrigin at - ${util.inspect(promise, true, null, false)}`);
});

bot.login(token);

const gdgetrated = require('./functions/gdgetrated.js');
gdgetrated.run(bot);
setInterval(() => gdgetrated.run(bot), config.getratedInterval * 60 * 1000);

const linkAccount = require('./functions/linkAccount.js');
linkAccount.run(bot);
setInterval(() => {
	if (linkAccMap.size > 0) linkAccount.run(bot);
}, config.linkAccInterval * 1000);

// Copy the database
if (config.copyDatabase) {
	setInterval(async () => {
		// Copy the file
		if (!fs.existsSync('./backups')) fs.mkdirSync('./backups');
		fs.copyFile('json.sqlite', `./backups/${await tools.timeFormatted()}.sqlite`, err => {
			if (err) return console.log(cErr(err));
			console.log(cLoadSucc(`Copied database!`));
		});
		// Delete the file after x days.
		setTimeout(() => {
			fs.unlink(`./backups/${copyTimeFormatted}.sqlite`, err => {
				if (err) return console.log(cErr(err));
			});
		}, config.deleteCopiedDatabaseInterval * 24 * 60 * 60 * 1000);
	}, config.copyDatabaseInterval * 60 * 1000);
}
