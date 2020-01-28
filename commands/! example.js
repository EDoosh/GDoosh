const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	message.channel.send('Hmmm...');
};

module.exports.config = {
	command: ['example-dont-use'],
	permlvl: 'All | Admin | BotOwner | DISABLED',
	help: ['Bot | Fun | Admin | BotOwner | Other', 'ShortDesc', 'All | Admin | BotOwner | DISABLED', 'CommandUsageExcludingName', 'Command description'],
	helpg: 'generalCommandSyntax',
};
