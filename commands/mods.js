const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const util = require('util');

module.exports.run = async (bot, message, args) => {
	if (!args[1]) {
		let l = await db.get(`ml`);
		if (!l || l.length < 2) return message.channel.send(`This command works off of people using \`${config.prefix}profile\`. It seems as though this list is empty, however.`);
		else {
			// [ 'playerId', { username: 'username', elder: 2/1 } ]
			let list = new Discord.Collection(l);
			let out = ['', ''];
			list = list.sort((a, b) => {
				return a.username[0].toUpperCase().charCodeAt() - b.username[0].toUpperCase().charCodeAt();
			});
			let longest = 0;
			list.forEach(n => {
				if (n.username.length > longest) longest = n.username.length;
			});
			list.forEach((n, k) => {
				while (n.username.length < longest) n.username += ' ';
				let l = parseInt(n.elder) - 1;
				let toAdd = `\`${n.username}\` ${playersByPID.has(k) ? config.emojis.checkbox_ticked : '⠀⠀⠀⠀⠀⠀⠀⠀'}\n`;
				let m = 0;
				while ((out[l + m] ? out[l + m].length : 0) + toAdd.length > 1024 || (out[l + 2 + m] ? out[l + 2 + m].length : 0) > 1) m += 2;
				if (!out[l + m]) out[l + m] = '';
				out[l + m] += toAdd;
			});
			message.channel.send(
				new Discord.RichEmbed()
					.setTitle(`GD Moderators (${list.size})`)
					.setDescription(`${config.emojis.checkbox_ticked} - User is linked to the bot.\n`)
					.setColor(0xeb3f75)
					.addField(`${config.emojis.mod_elder}⠀Elder Moderators`, out[1] || 'None found...', true)
					.addField(`(${((out[1] + out[3]).match(new RegExp('\n', 'g')) || []).length})`, out[3] || '⠀', true)
					.addBlankField(true)
					.addField(`${config.emojis.mod}⠀Moderators`, out[0] || 'None found...', true)
					.addField(`(${((out[0] + out[2]).match(new RegExp('\n', 'g')) || []).length})`, out[2] || '⠀', true)
					.addField(`⠀`, out[4] || '⠀', true),
			);
		}
	} else {
		let msg = await message.channel.send(`Finding user...`);
		let player = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, 1), bot), true);
		if (!player) return msg.edit(`Cannot find this user!`);
		await msg.edit(`Looking at their profile information...`);
		let profile = await gdtools.profile(player[2]);
		msg.edit(`This user is ||\`${profile.moderator == 0 ? 'Not a Geometry Dash Moderator  ' : profile.moderator == 1 ? 'A Geometry Dash Moderator      ' : 'A Geometry Dash Elder Moderator'}\`||`);
	}
};

module.exports.config = {
	command: ['mods', 'moderators', 'modlist', 'ml', 'mod', 'checkmod', 'cm'],
	permlvl: 'All',
	help: ['Fun', 'Give a list of all Geometry Dash moderators.', 'All', '', 'Give a list of all Geometry Dash moderators.', 'All', '[gdRepresentable]', 'Check if a user is a GD Mod.'],
	helpg: '',
};
