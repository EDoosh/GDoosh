const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const ms = require('ms');

module.exports.run = async (bot, message, args) => {
	let emoji = await bot.emojis.find(x => x.name === args[2]);
	if (!emoji) return message.channel.send('e');
	if (args[1] === 's') message.channel.send(emoji.toString());
	else {
		let msg = await message.channel.fetchMessage(args[1]);
		if (!msg) return message.channel.send('i');
		msg.react(emoji);
	}
};

module.exports.config = {
	command: ['testing', 'a'],
	permlvl: 'DISABLED',
	help: ['BotOwner', 'Test stuff', 'BotOwner', '', 'Test stuff.'],
	helpg: 'generalCommandSyntax',
};
