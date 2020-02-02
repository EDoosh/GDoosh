const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const fs = require('fs');

module.exports.run = async (bot, message, args) => {
	let dmto = message.channel;

	const category = ['Bot', 'Fun', 'Admin', 'BotOwner', 'Other'];
	const catcolour = ['eee655', '58ee55', 'ee5555', 'ffffff', '55eeee'];
	const catdesc = ['Information about the bot.', 'Geometry Dash related commands.', 'Commands for admins only.', 'Commands for the Bot Owner only.', "Some other things that everyone can use but don't fit into any other category."];

	const ignoreCommands = ['example-dont-use'];
	const footer = `${NAME}'s Command Help\u2800⬥\u2800Version ${VERSION}\u2800⬥\u2800${prefix}help [commandName]`;

	if (category.includes(args[1])) {
		let specpos = category.indexOf(args[1]);
		let speccatembed = new Discord.RichEmbed()
			.setColor(`0x${catcolour[specpos]}`)
			.setAuthor(`${category[specpos]}   |   ${catdesc[specpos]}`, `http://singlecolorimage.com/get/${catcolour[specpos]}/128x128`)
			.setFooter(footer);

		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const commande = require(`./${file}`);
			if (!commande.config.help) {
				if (!ignoremissinghelp.includes(commande.config.command[0])) console.log(cErr(`A file was missing a help section (`) + cErrInfo(file) + cErr(`)`));
				continue;
			}
			if (ignoreCommands.includes(commande.config.command[0])) continue;
			if (commande.config.help[0] == args[1]) speccatembed.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`, false);
		}
		await dmto.send(speccatembed);
	} else if (args[1]) {
		let helpcmd = bot.commands.get(args[1].toLowerCase());
		if (!helpcmd) return message.channel.send(`The command \`${prefix}${args[1]}\` does not exist!`);

		let hcmd = helpcmd.config.help;
		let pos = category.indexOf(hcmd[0]);

		let hcmdembed = new Discord.RichEmbed();
		hcmdembed.setAuthor(`${category[pos]}   |   ${prefix}${helpcmd.config.command[0]}`, `http://singlecolorimage.com/get/${catcolour[pos]}/128x128`);
		hcmdembed.setDescription(`Description: ${hcmd[1]}\n\nAliases: ${helpcmd.config.command.join(', ')}\n\u2800`);
		hcmdembed.setColor(`0x${catcolour[pos]}`);
		hcmdembed.setFooter(footer);
		for (i = 2; i < helpcmd.config.help.length; i += 3) hcmdembed.addField(`${hcmd[i]}  |  ${prefix}${helpcmd.config.command[0]} ${hcmd[i + 1]}`, `${hcmd[i + 2]}`);
		dmto.send(hcmdembed);
	} else {
		message.channel.send(`Please type \`${prefix}help [categoryName]\`. All category names are listed below.\n>>> Bot\nFun\nAdmin\nBotOwner\nOther`);
	}
};

module.exports.config = {
	command: ['help', 'h'],
	permlvl: 'All',
	help: ['Bot', 'List commands and their descriptions.', 'All', '', 'Send the help menu to the channel.', 'All', '[command name]', 'Get help with a specific command.', 'All', '[category name]', 'Display all the commands in a category.'],
	helpg: '',
};
