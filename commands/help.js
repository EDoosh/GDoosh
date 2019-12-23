const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const fs = require('fs');

module.exports.run = async (bot, message, args) => {
	let dmto = message.channel;

	const category = ['Bot', 'Fun', 'Admin', 'BotOwner', 'Other'];
	const catcolour = ['eee655', '58ee55', 'ee5555', 'ffffff', '55eeee'];
	const catdesc = ['Information about the bot.', 'Some fun little commands to spice up the server.', 'Commands for admins only.', 'Commands for the Bot Owner only.', "Some other things that everyone can use but don't fit into any other category."];

	const ignoreCommands = ['example-dont-use'];
	const footer = `${NAME}'s Command Help\u2800⬥\u2800Version ${VERSION}\u2800⬥\u2800${prefix}help [command name]`;

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
		let helpabout = new Discord.RichEmbed()
			.setColor(`0x${catcolour[0]}`)
			.setAuthor(`${category[0]}   |   ${catdesc[0]}`, `http://singlecolorimage.com/get/${catcolour[0]}/128x128`)
			.setFooter(footer);
		let helpfun = new Discord.RichEmbed()
			.setColor(`0x${catcolour[1]}`)
			.setAuthor(`${category[1]}   |   ${catdesc[1]}`, `http://singlecolorimage.com/get/${catcolour[1]}/128x128`)
			.setFooter(footer);
		let helpadmin = new Discord.RichEmbed()
			.setColor(`0x${catcolour[2]}`)
			.setAuthor(`${category[2]}   |   ${catdesc[2]}`, `http://singlecolorimage.com/get/${catcolour[2]}/128x128`)
			.setFooter(footer);
		let helped = new Discord.RichEmbed()
			.setColor(`0x${catcolour[3]}`)
			.setAuthor(`${category[3]}   |   ${catdesc[3]}`, `http://singlecolorimage.com/get/${catcolour[3]}/128x128`)
			.setFooter(footer);
		let helpother = new Discord.RichEmbed()
			.setColor(`0x${catcolour[4]}`)
			.setAuthor(`${category[4]}   |   ${catdesc[4]}`, `http://singlecolorimage.com/get/${catcolour[4]}/128x128`)
			.setFooter(footer);

		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const commande = require(`./${file}`);
			if (!commande.config.help) {
				if (!ignoremissinghelp.includes(commande.config.command[0])) console.log(cErr(`A file was missing a help section (`) + cErrInfo(file) + cErr(`)`));
				continue;
			}
			if (ignoreCommands.includes(commande.config.command[0])) continue;
			else if (commande.config.help[0] == 'Bot') helpabout.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`);
			else if (commande.config.help[0] == 'Fun') helpfun.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`);
			else if (commande.config.help[0] == 'Admin') helpadmin.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`);
			else if (commande.config.help[0] == 'BotOwner') helped.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`);
			else if (commande.config.help[0] == 'Other') helpother.addField(`${prefix}${commande.config.command[0]}`, `${commande.config.help[1]}`);
		}

		await dmto.send(helpabout);
		await dmto.send(helpfun);
		if (hasAdmin || !config.ownerId.includes(message.member.id)) await dmto.send(helpadmin);
		if (config.ownerId.includes(message.member.id)) await dmto.send(helped);
		await dmto.send(helpother);
		if (!hasAdmin && !config.ownerId.includes(message.member.id)) await dmto.send(`Some commands have been ommitted, as you do not have access to the commands in the server you used '${prefix}help' in.`);
	}
};

module.exports.config = {
	command: ['help', 'h'],
	permlvl: 'All',
	help: ['Bot', 'List commands and their descriptions.', 'All', '', 'Send the help menu to the channel.', 'All', '[command name]', 'Get help with a specific command.', 'All', '[category name]', 'Display all the commands in a category.'],
	helpg: '',
};
