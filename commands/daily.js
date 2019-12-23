const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let msg = await message.channel.send(`Retrieving daily level...`);
	let daily = await gdtools.getLevel('daily');
	if (!daily || daily === '-1') return msg.edit(`There is currently no daily level.`);
	daily.type = 'daily';
	msg.edit(`${config.emojis.daily} Here is the daily level!`, await gdtools.createEmbed(bot, daily));
};

module.exports.config = {
	command: ['daily', 'd'],
	permlvl: 'All',
	help: ['Fun', 'Retrieves the daily level.', 'All', '', 'Retrieves the daily level.'],
	helpg: '',
};
