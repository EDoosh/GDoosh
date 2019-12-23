const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	message.channel.send('Hmmm...');
};

module.exports.config = {
	command: ['example-dont-use'],
	permlvl: 'All | Admin | BotOwner | DISABLED',
    help: ['Bot | Fun | Admin | BotOwner | Other', 'ShortDesc',
			'All | Admin | BotOwner | DISABLED', 'CommandUsageExcludingName', 'Command description'],
	helpg: 'generalCommandSyntax',
};
