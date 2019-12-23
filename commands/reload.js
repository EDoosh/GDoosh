const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!args[1]) return;

	if (args[1] === 'shutdown') {
		try {
			await message.channel.send(`Shutting down...`);
			process.exit();
		} catch (err) {
			return message.channel.send(`Failed to shut down - \`${e.message}\``);
		}
	}

	let cmd = bot.commands.get(args[1].toLowerCase());
	if (!cmd) return message.channel.send(`Issue finding the file \`${args[1].toLowerCase()}.js\``);
	cmd = cmd.config.command;
	try {
		delete require.cache[require.resolve(`./${cmd[0]}.js`)];
		for (i = 0; i < cmd.length; i++) bot.commands.delete(cmd[i]);
		let pull = require(`./${cmd[0]}.js`);
		for (i = 0; i < pull.config.command.length; i++) bot.commands.set(pull.config.command[i], pull);
	} catch (err) {
		return message.channel.send(`Issue reloading the file \`${args[1].toLowerCase()}.js\``);
	}
	message.channel.send(`Successfully reloaded command.`);
};

module.exports.config = {
	command: ['reload'],
	permlvl: 'BotOwner',
	help: ['BotOwner', 'Reloads a command. This should only be used for testing purposes.', 'BotOwner', '[commandName]', 'Reloads a command.', 'BotOwner', 'shutdown', 'Shuts down the bot.'],
	helpg: '',
};
