const db = require('quick.db');
const Discord = require('discord.js');
const tools = require('../functions/generalFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers, for obvious reasons.`);
	// Administrator
	// Rated pings
	// Timed pings
	// Rated levels
	// Timed levels
	// Special Announcements
	// Bot updates channel

	let pingRoleS = pingRole.get(message.guild.id) || [null, null];
	let announceChannelS = announceChannels.get(message.guild.id) || [null, null, null];

	let modifySubs = {
		array: [
			{
				title: 'Administrator',
				desc: 'The roles with the Administrator permission.',
				dbpre: 'adminRoles',
				type: 'role',
				value: adminrole,
				multi: true,
			},
			{
				title: 'Rated Levels Role',
				desc: 'The role to be pinged when a level has been rated.',
				dbpre: 'pingRoles',
				type: 'role',
				value: pingRoleS[0],
				multi: false,
			},
			{
				title: 'Timed Levels Role',
				desc: 'The role to be pinged when a level gets daily or weekly.',
				dbpre: 'pingRoles',
				type: 'role',
				value: pingRoleS[1],
				multi: false,
			},
			{
				title: 'Rated Levels Channel',
				desc: 'The channel that newly rated levels get sent to.',
				dbpre: 'announceChannel',
				type: 'channel',
				value: announceChannelS[0],
			},
			{
				title: 'Timed Levels Channel',
				desc: 'The channel that daily and weekly levels get sent to.',
				dbpre: 'announceChannel',
				type: 'channel',
				value: announceChannelS[1],
			},
			{
				title: 'Special Levels Channel',
				desc: 'If a linked user in your server gets a rated or timed level, a message will be sent in this channel.',
				dbpre: 'announceChannel',
				type: 'channel',
				value: announceChannelS[2],
			},
			{
				title: 'Bot Updates Channel',
				desc: 'The channel for announcements about the bot.',
				dbpre: 'botUpdates',
				type: 'channel',
				value: botUpdates.get(message.guild.id) || null,
			},
		],
	};

	// Set all the emojis that it can be reacted with
	var reactions = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3', '\u0038\u20E3', '\u0039\u20E3'];
	// Create a new embed with these properties
	let embedAll = new Discord.RichEmbed()
		.setTitle(`Role and Channel Setup`)
		.setDescription(`React with a number to change a value.\nReact with a 0 to cancel the selection.`)
		.setColor(0x2599f7);
	// For the length of the json we created earlier, add a new field with the sub-command's information
	let cursetto = [];
	for (i = 0; i < modifySubs.array.length; i++) {
		let item = modifySubs.array[i];
		let newcursetto = [];

		if (item.type == 'role') {
			if (item.multi === false) {
				if (item.value === null) newcursetto.push(`There is currently no ${item.title} set.`);
				else {
					let retreiverole = await tools.getRole(message, item.value);
					if (!retreiverole) newcursetto.push(`DELETED ROLE (${item.value})`);
					else newcursetto.push(`@${retreiverole.name} (${item.value})`);
				}
			} else {
				if (item.value.length === 0) newcursetto.push(`No roles exist with ${item.title} permission in the bot!`);
				else {
					for (j = 0; j < item.value.length; j++) {
						let retreiverole = await tools.getRole(message, item.value[j]);
						if (!retreiverole) {
							newcursetto.push(`DELETED ROLE (${item.value[j]})`);
							continue;
						}
						newcursetto.push(`@${retreiverole.name} (${item.value[j]})`);
					}
				}
			}
		} else {
			if (item.value === 0 || item.value === null) newcursetto.push(`${item.title} is currently off!`);
			else {
				let retrievedChannel = await tools.getChannel(message, item.value);
				if (!retrievedChannel) newcursetto.push(`DELETED CHANNEL (${item.value})`);
				else newcursetto.push(`#${retrievedChannel.name} (${item.value})`);
			}
		}

		embedAll.addField(`${reactions[i + 1]} ⠀⠀${item.title}`, `*\`${newcursetto.join('\n')}\`*`);
		cursetto.push(newcursetto);
	}

	// Send the message and let embedmsg be the message
	let embedmsg = await message.channel.send(embedAll);
	// Create a filter for the following that returns true only if it reactor is the person who ran -=c, and that it is an allowed reaction.
	const filter = (reaction, user) => {
		return reactions.includes(reaction.emoji.name) && user.id === message.author.id;
	};
	// Create a reaction collector that gets all reactions that are reacted on the previous message for 10 seconds, as long as it complies with the filter.
	var reactcollector = embedmsg.createReactionCollector(filter, { max: 1, time: 20000, errors: ['time'] });
	// When the message is reacted on...
	reactcollector.on('collect', async resp => onCollect(resp));

	// If the message was never reacted on when the time runs out...
	reactcollector.on('end', collected => {
		if (collected.size != 0) return;
		embedmsg.clearReactions();
		embedmsg.edit(new Discord.RichEmbed(embedmsg.embeds[0]).setFooter(`Modify selection timed out. Cancelled selection.`));
	});

	// React on the server config message. Do this here so that, if a user reacts while the bot is still reacting, it still runs the reactcollector
	for (i = 0; i <= modifySubs.array.length; i++) {
		try {
			await embedmsg.react(reactions[i]);
		} catch {
			break;
		}
	}

	async function onCollect(resp) {
		// Set reaction to the name of the reaction
		const reaction = resp.emoji.name;
		// Set switch to the name of the reaction
		switch (reaction) {
			case '0⃣': // If they wish to cancel, then cancel.
				return message.channel.send('Cancelled Modify selection.');
			case '1⃣': // If they want one of the options, set the ID of the subcommand to its location in the reactions array - 1
			case '2⃣':
			case '3⃣':
			case '4⃣':
			case '5⃣':
			case '6⃣':
			case '7⃣':
			case '8⃣':
			case '9⃣':
				var subCmd = modifySubs.array[reactions.indexOf(reaction) - 1];
				var reactionId = reactions.indexOf(reaction) - 1;
				break;
			case 'default': // If none of the above, then idk wtf happened.
				return message.channel.send('An issue occured while trying to register what the fuck you just did.');
		}
		// Delete the old embed message
		embedmsg.delete();
		// Create a new one with the subcommands name, desc, cur value, and what it wants.
		const pleaseType = subCmd.type === 'role' ? `Please type in a roleRepresentable to add it in to the permission. If it is already a part of that permission, it will be removed.` : `Please type in a channelRepresentable to set a new value, or type 'off' to disable it.`;
		let embedval = new Discord.RichEmbed()
			.setTitle(subCmd.title)
			.setDescription(`${subCmd.desc}\n*Currently set to \n\`${cursetto[reactionId].join('\n')}\`*\n**${pleaseType}**`)
			.setColor(0x10e851);
		// Then send it
		let valmsg = await message.channel.send(embedval);
		// New filter for below. make sure it is sent by the original person.
		let filterVal = async pmsg => {
			if (pmsg.author.id !== message.author.id) return false;
			//								   \/ To remove by ID if its been deleted     \/                         \/ To add/remove if it exists
			if (subCmd.type == 'role') return (!subCmd.multi ? subCmd.value === pmsg.content : subCmd.value.includes(pmsg.content)) || (await tools.getRole(pmsg, pmsg.content));
			else return pmsg.content == 'off' || (await tools.getChannel(pmsg, pmsg.content));
		};
		// Await a message which complies with the above and is sent within 20 seconds. If there isn't one, show error.
		try {
			var newval = await message.channel.awaitMessages(filterVal, { maxMatches: 1, time: 60000, errors: ['time'] });
		} catch (err) {
			valmsg.delete();
			return message.channel.send(`Modify value set timed out. Cancelled new value set.`);
		}
		valmsg.delete();
		try {
			newval.first().delete();
		} catch {}
		let content = newval.first().content;
		let v = subCmd.value;
		if (subCmd.type == 'role') {
			if (subCmd.multi === false) {
				if (v === content) v = 0;
				else {
					let rolecol = await tools.getRole(newval.first(), content);
					if (!rolecol) return message.channel.send(`The role \`${content}\` does not exist!`);
					if (v === rolecol.id) v = 0;
					else v = rolecol.id;
				}
				modifySubs.array[reactionId].value = v;
				if (subCmd.dbpre === 'pingRoles') {
					await pingRole.set(message.guild.id, [modifySubs.array[1].value, modifySubs.array[2].value]);
					db.set(`pingRoles`, await tools.arrayMap(pingRole));
				}
			} else {
				if (v.includes(content)) v.splice(v.indexOf(content), 1);
				else {
					let rolecol = await tools.getRole(newval.first(), content);
					if (!rolecol) return message.channel.send(`The role \`${content}\` does not exist!`);
					if (v.includes(rolecol.id)) v.splice(v.indexOf(content), 1);
					else v.push(rolecol.id);
				}
				modifySubs.array[reactionId].value = v;
				if (subCmd.dbpre === 'adminRoles') {
					await admin.set(message.guild.id, modifySubs.array[reactionId].value);
					db.set(`adminRoles`, await tools.arrayMap(admin));
				}
			}
		} else {
			if (content === 'off') {
				modifySubs.array[reactionId].value = null;
				if (subCmd.dbpre === 'announceChannel') {
					await announceChannels.set(message.guild.id, [modifySubs.array[3].value, modifySubs.array[4].value, modifySubs.array[5].value]);
					db.set(`announceChannel`, await tools.arrayMap(announceChannels));
				} else if (subCmd.dbpre === 'botUpdates') {
					await botUpdates.set(message.guild.id, modifySubs.array[reactionId].value);
					db.set(`botUpdates`, await tools.arrayMap(botUpdates));
				}
				message.channel.send(`Turned off ${subCmd.title}`);
			} else {
				let chancol = await tools.getChannel(newval.first(), content);
				if (!chancol) message.channel.send(`The channel \`${content}\` does not exist!`);
				else {
					message.channel.send(`New channel set to ${chancol}`);
					chancol.send(`${subCmd.title} set to this location!`);
					modifySubs.array[reactionId].value = chancol.id;
					if (subCmd.dbpre === 'announceChannel') {
						await announceChannels.set(message.guild.id, [modifySubs.array[3].value, modifySubs.array[4].value, modifySubs.array[5].value]);
						db.set(`announceChannel`, await tools.arrayMap(announceChannels));
					} else if (subCmd.dbpre === 'botUpdates') {
						await botUpdates.set(message.guild.id, modifySubs.array[reactionId].value);
						db.set(`botUpdates`, await tools.arrayMap(botUpdates));
					}
				}
			}
		}
	}
};

module.exports.config = {
	command: ['setup', 's', 'modify', 'm'],
	permlvl: 'Admin',
	help: ['Admin', 'Modify a role or channels bot data.', 'Admin', '', "List all modify's possible. Use reactions to edit a value."],
	helpg: '',
};
