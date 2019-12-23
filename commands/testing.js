const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let embed = new Discord.RichEmbed().setTitle(`And this is more text`);
	message.channel.send(`This is some text`, embed);
};

module.exports.config = {
	command: ['testing'],
	permlvl: 'DISABLED',
	help: ['BotOwner', 'Test stuff', 'BotOwner', '', 'Test stuff.'],
	helpg: 'generalCommandSyntax',
};
