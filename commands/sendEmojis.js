const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let send = '';
	for (let [key, value] of Object.entries(config.emojis)) {
		let add = `${value} - \`${key}\`\n`;
		if (send.length + add.length > 2000) {
			message.channel.send(send);
			send = '';
		}
		send += add;
	}
	message.channel.send(send);
};

module.exports.config = {
	command: ['sendemojis'],
	permlvl: 'BotOwner',
	help: ['BotOwner', 'Test whether all emojis are working as intended', 'BotOwner', '', 'Test whether all emojis are working as intended'],
	helpg: '',
};
