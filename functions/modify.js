const db = require('quick.db');
const Discord = require('discord.js');
const tools = require('../generalFunctions.js');

module.exports.run = async (bot, message, args) => {
	// Retriev info
	// await db.set(`muterole_${message.guild.id}`, 0);
	let fdj = (await db.get(`djrole_${message.guild.id}`)) || 0;
	let fmban = (await db.get(`mbanrole_${message.guild.id}`)) || 0;
	let fmute = (await db.get(`muterole_${message.guild.id}`)) || 0;
	let fqc = await db.get(`quoteChannel_${message.guild.id}`);
	let fbuc = await db.get(`botupChannel`);
	let botupID = fbuc.guild.indexOf(message.guild.id);
	let foneword = await db.get(`oneWordStoryChannel_${message.guild.id}`);
	let fcount = await db.get(`countChannel_${message.guild.id}`);
	let fchain = await db.get(`chainChannel_${message.guild.id}`);

	let modifySubs = {
		array: [
			{
				title: 'Administrator',
				desc: 'The roles with the Administrator DooshBot permission, which allows access to all staff commands.',
				dbpre: 'adminrole',
				type: 'role',
				value: adminrole,
			},
			{
				title: 'Moderator',
				desc: 'The roles with the Moderator DooshBot permission, which allows access to a lot of staff commands.',
				dbpre: 'modrole',
				type: 'role',
				value: modrole,
			},
			{
				title: 'Role Modify',
				desc: 'The roles with the Role Modify permission, which allows users to create and edit their own custom roles.',
				dbpre: 'rmrole',
				type: 'role',
				value: rmrole,
			},
			{
				title: 'DJ',
				desc: 'The roles with the DJ permission, which allows access to all music-related commands.',
				dbpre: 'mbanrole',
				type: 'role',
				value: !fdj ? [] : fdj,
			},
			{
				title: 'Music Ban',
				desc: 'The roles with the Music Ban permission, which denies access to most music-related commands.',
				dbpre: 'djrole',
				type: 'role',
				value: !fmban ? [] : fmban,
			},
			{
				title: 'Muted',
				desc: 'The role assigned to a user when they are muted.',
				dbpre: 'muterole',
				type: 'role',
				value: !fmute ? [] : [fmute],
			},
			{
				title: 'Log Channel',
				desc: 'The Log Channel, which all staff related commands will be sent to.',
				dbpre: 'logChannel',
				type: 'channel',
				value: logChannel,
			},
			{
				title: 'Quote Channel',
				desc: 'The Quote Channel, which all quoted messages will be sent to.',
				dbpre: 'quoteChannel',
				type: 'channel',
				value: fqc == null || fqc == 0 ? 0 : message.guild.channels.get(fqc),
			},
			{
				title: 'Bot Updates Channel',
				desc: 'The Bot Updates Channel, which all DooshBot related messages will be sent to.',
				dbpre: 'botupChannel',
				type: 'channel',
				value: botupID === -1 ? 0 : message.guild.channels.get(fbuc.channel[botupID]),
			},
			{
				title: 'One Word Story Channel',
				desc: 'One Word Story channel. Type out a story, one person, one message, one word at a time.',
				dbpre: 'oneWordStoryChannel',
				type: 'channel',
				value: foneword == null || foneword == 0 ? 0 : message.guild.channels.get(foneword),
			},
			{
				title: 'Counting Channel',
				desc: 'Count up infinitely. One by one.',
				dbpre: 'countChannel',
				type: 'channel',
				value: fcount == null || fcount == 0 ? 0 : message.guild.channels.get(fcount),
			},
			{
				title: 'Chains Channel',
				desc: 'How long can your server repeat the same message?',
				dbpre: 'chainChannel',
				type: 'channel',
				value: fchain == null || fchain == 0 ? 0 : message.guild.channels.get(fchain),
			},
		],
	};

	// Set all the emojis that it can be reacted with
	var reactions = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3', '\u0038\u20E3', '\u0039\u20E3', '<:10:646514939598733329>', '<:11:646514938872856587>', '<:12:646514939262926859>'];
	var reactWith = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3', '\u0038\u20E3', '\u0039\u20E3', ':10:646514939598733329', ':11:646514938872856587', ':12:646514939262926859'];
	var reactionNames = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3', '\u0038\u20E3', '\u0039\u20E3', '10', '11', '12'];
	// Create a new embed with these properties
	let embedAll = new Discord.RichEmbed()
		.setTitle(`Permission and Channel Setup`)
		.setDescription(`React with a number to change a value.\nReact with a 0 to cancel the selection.`)
		.setColor(0x2599f7);
	// For the length of the json we created earlier, add a new field with the sub-command's information
	let cursetto = [];
	for (i = 0; i < modifySubs.array.length; i++) {
		let item = modifySubs.array[i];
		let newcursetto = [];

		if (item.type == 'role') {
			if (item.title === 'Muted') {
				if (item.value.length === 0) newcursetto.push(`There is currently no Muted role set.`);
				else {
					let mutedrole = await tools.getRole(message, item.value[0]);
					if (!mutedrole) newcursetto.push(`DELETED ROLE (${item.value[0]})`);
					else newcursetto.push(`${mutedrole.name} (${item.value[0]})`);
				}
			} else {
				if (item.value.length === 0) newcursetto.push(`No roles exist with ${item.title} permission in the bot!`);
				else {
					for (j = 0; j < item.value.length; j++) {
						let retreiverole = await message.guild.roles.find(x => x.id == item.value[j]);
						if (!retreiverole) {
							newcursetto.push(`DELETED ROLE (${item.value[j]})`);
							continue;
						}
						newcursetto.push(`${retreiverole.name} (${item.value[j]})`);
					}
				}
			}
		} else {
			if (item.value === 0 || item.value === null) {
				newcursetto.push(`${item.title} is currently off!`);
			} else {
				if (item.value === 0 || !item.value) newcursetto.push(`DELETED CHANNEL`);
				else newcursetto.push(`#${item.value.name} (${item.value.id})`);
			}
		}

		embedAll.addField(`${reactions[i + 1]} ⠀⠀${item.title}`, `${item.desc}\n*\`${newcursetto.join('\n')}\`*`);
		cursetto.push(newcursetto);
	}

	// Send the message and let embedmsg be the message
	let embedmsg = await message.channel.send(embedAll);
	// Create a filter for the following that returns true only if it reactor is the person who ran -=c, and that it is an allowed reaction.
	const filter = (reaction, user) => {
		return (reactWith.includes(reaction.emoji.name) || reactWith.includes(`:${reaction.emoji.name}:${reaction.emoji.id}`)) && user.id === message.author.id;
	};
	// Create a reaction collector that gets all reactions that are reacted on the previous message for 10 seconds, as long as it complies with the filter.
	var reactcollector = embedmsg.createReactionCollector(filter, { max: 1, time: 20000, errors: ['time'] });
	// When the message is reacted on...
	reactcollector.on('collect', async resp => {
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
			case '10':
			case '11':
			case '12':
			case '13':
			case '14':
			case '15':
			case '16':
			case '17':
			case '18':
			case '19':
				var subCmd = modifySubs.array[reactionNames.indexOf(reaction) - 1];
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
			.setDescription(`${subCmd.desc}\n*Currently set to \n\`${cursetto[reactionNames.indexOf(reaction) - 1].join('\n')}\`*\n**${pleaseType}**`)
			.setColor(0x10e851);
		// Then send it
		let valmsg = await message.channel.send(embedval);
		// New filter for below. If it wants a number, make sure it is a number. If it wants a T/F, make sure it is a T/F. Also make sure it is sent by the original person.
		let filterVal = async pmsg => {
			if (pmsg.author.id !== message.author.id) {
				return false;
			}
			if (subCmd.type == 'role') {
				// If it can find something with that ID in modrole, something with that ID in the server, or something with that name in the server, it returns true
				return subCmd.value.includes(pmsg.content) || (await tools.getRole(pmsg, pmsg.content));
			} else {
				// If the user types 'off', a channel is mentioned, a channel id is said, or a channel name is said, it returns true.
				return pmsg.content == 'off' || (await tools.getChannel(pmsg, pmsg.content));
			}
		};
		// Await a message which complies with the above and is sent within 20 seconds. If there isn't one, show error.
		try {
			var newval = await message.channel.awaitMessages(filterVal, {
				maxMatches: 1,
				time: 20000,
				errors: ['time'],
			});
		} catch (err) {
			valmsg.delete();
			return message.channel.send(`Modify value set timed out. Cancelled new value set.`);
		}
		valmsg.delete();
		try {
			newval.first().delete();
		} catch {}
		let content = newval.first().content;
		if (subCmd.type == 'role') {
			if (subCmd.value.includes(content)) {
				subCmd.value.splice(subCmd.value.indexOf(content), 1);
				if (subCmd.value.length === 0) subCmd.value = 0;
				db.set(`${subCmd.dbpre}_${message.guild.id}`, subCmd.value);
				message.channel.send(`The role \`${content}\` has been removed from ${subCmd.title} for this bot!`);
			} else {
				// Create collection of the role
				let rolecol = await tools.getRole(newval.first(), content);
				// Check if there is a role. If not, throw error.
				if (!rolecol) return message.channel.send(`The role \`${content}\` does not exist!`);
				// Remove by name
				if (subCmd.value.includes(rolecol.id)) {
					subCmd.value.splice(subCmd.value.indexOf(rolecol.id), 1);
					if (subCmd.value.length === 0) subCmd.value = 0;
					db.set(`${subCmd.dbpre}_${message.guild.id}`, subCmd.value);
					message.channel.send(`The role \`${rolecol.name}\` has been removed from ${subCmd.title} for this bot!`);
				} else {
					if (reactionNames.indexOf(reaction) === 6) {
						if (subCmd.value.length !== 0) return message.channel.send(`There is already a role with Muted. Please remove that first!`);
						let talkingChannels = ['text', 'news', 'store'];
						for (const channel of message.guild.channels) {
							let chan = channel[1];
							console.log(chan);
							try {
								if (talkingChannels.includes(chan.type)) chan.overwritePermissions(rolecol, { SEND_MESSAGES: false });
								else if (chan.type === 'voice') chan.overwritePermissions(rolecol, { SPEAK: false });
								else continue;
							} catch (err) {
								console.error(err);
								message.channel.send(`Error editting channel ${chan}`);
								break;
							}
						}
						db.set(`${subCmd.dbpre}_${message.guild.id}`, rolecol.id);
						message.channel.send(`The role \`${rolecol.name}\` now has ${subCmd.title} for this bot!`);
					} else {
						subCmd.value.push(rolecol.id);
						db.set(`${subCmd.dbpre}_${message.guild.id}`, subCmd.value);
						message.channel.send(`The role \`${rolecol.name}\` now has ${subCmd.title} permission for this bot!`);
					}
				}
			}
		} else {
			if (content === 'off') {
				// When they want to turn it off...
				if (reactionNames.indexOf(reaction) === 9) {
					// If it is Bot Updates Channel
					if (subCmd.value === 0) return;
					fbuc.guild.splice(botupID, 1);
					fbuc.channel.splice(botupID, 1);
					db.set(`botupChannel`, { guild: fbuc.guild, channel: fbuc.channel });
				} else {
					db.set(`${subCmd.dbpre}_${message.guild.id}`, 0);
					if (reactionNames.indexOf(reaction) === 11) db.set(`countData_${message.guild.id}`, 0);
					if (reactionNames.indexOf(reaction) === 12) db.set(`chainData_${message.guild.id}`, 0);
					if (reactionNames.indexOf(reaction) === 10) {
						db.set(`owsData_${message.guild.id}`, 0);
						db.set(`owsFull_${message.guild.id}`, 0);
					}
				}
				message.channel.send(`Turned off ${subCmd.title}`); // Announce
			} else {
				let chancol = await tools.getChannel(newval.first(), content, false);

				if (!chancol) {
					// If there is a mentioned channel but it doesnt exist
					message.channel.send(`The channel \`${content}\` does not exist!`); // Complain the channel doesnt exist
				} else {
					// If a channel does exist
					if (reactionNames.indexOf(reaction) === 11) db.set(`countData_${message.guild.id}`, 0);
					if (reactionNames.indexOf(reaction) === 12) db.set(`chainData_${message.guild.id}`, 0);
					if (reactionNames.indexOf(reaction) === 10) {
						db.set(`owsData_${message.guild.id}`, 0);
						db.set(`owsFull_${message.guild.id}`, []);
					}
					message.channel.send(`New channel set to <#${chancol.id}>`); // Say new channel
					let chanID = chancol.id; // Set logchannelid
					newChannel = bot.channels.get(chanID); // set log channel
					if (reactionNames.indexOf(reaction) === 9) {
						// If it is Bot Updates Channel
						if (subCmd.value !== 0) {
							fbuca.guild.splice(botupID, 1);
							fbuca.channel.splice(botupID, 1);
						}
						fbuc.guild.push(message.guild.id);
						fbuc.channel.push(chanID);
						db.set(`botupChannel`, { guild: fbuc.guild, channel: fbuc.channel }); // set logchannel in db to logchannelid
					} else {
						await db.set(`${subCmd.dbpre}_${message.guild.id}`, chanID); // set logchannel in db to logchannelid
					}
					newChannel.send(`${subCmd.title} set to this location!`); // announce
				}
			}
		}
	});

	// If the message was never reacted on when the time runs out...
	reactcollector.on('end', collected => {
		if (collected.size != 0) return;
		// Delete the message and say so
		try {
			embedmsg.first().delete();
		} catch {}
		message.channel.send(`Modify selection timed out. Cancelled selection.`);
	});

	// React on the server config message. Do this here so that, if a user reacts while the bot is still reacting, it still runs the reactcollector
	for (i = 0; i <= modifySubs.array.length; i++) {
		try {
			await embedmsg.react(reactWith[i]);
		} catch {
			break;
		}
	}
};

module.exports.config = {
	command: ['modify', 'm'],
	permlvl: 'Admin',
	help: ['Admin', 'Modify a role or channels bot data.', 'Admin', '', "List all modify's possible. Use reactions to edit a value."],
	helpg: '',
};
