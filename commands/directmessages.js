const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const XOR = require('../functions/XOR.js');
const gdtools = require('../functions/gdFunctions.js');
const xor = new XOR();
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	const pId = await playersByUID.get(message.author.id);
	if (!pId) return message.channel.send(`Please link up your account using \`${config.prefix}link\``);
	let ps = await passwords.get(message.author.id);
	if (!ps) return message.channel.send(`Please link up your password using \`${config.prefix}pass\``);
	ps = xor.encrypt(ps, 37526);
	const profile = await gdtools.profile(pId);
	if (!profile) return message.channel.send(`Sorry, there was an issue getting your profile information!`);
	if (!args[1] || ['read', 'r', 'view', 'v', 'messages', 'message', 'm', 'dm'].includes(args[1])) {
		if (!message.guild) return message.channel.send(`This sub-command may only be used in servers, due to Discord limitations.`);
		const e = config.emojis;
		message.delete();

		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Beginning Message Search...`));
		// page, sent?, page+, msg
		msgLoop(0, args[2] === 's', 0, msg);

		async function msgLoop(pg, sent, pgP, msg) {
			msg.clearReactions();
			let embed = new Discord.RichEmbed()
				.setColor(0x42e3f5)
				.setTitle(`__${profile.username}'s__⠀${sent ? 'Sent' : 'Recieved'} Messages`)
				.setAuthor(`Page ${pg * 2 + Math.floor(pgP / 5) + 1}`, `https://edoosh.github.io/Images/GD/Emojis/Profiles/messages.png`);
			let dm = await recieve(pg, pgP, sent);
			if (dm == '-1' || !dm || !dm[0] || !dm[1]) embed.addField(`Error`, `An error occured while getting this page of messages.`);
			else {
				for (i = 0; i < dm.length; i++) {
					let text = `${dm[i].special === 0 ? '' : dm[i].special === 1 ? 'diff' : 'glsl'}\n${dm[i].special === 1 ? '- ' : dm[i].special === 2 ? '# ' : ''}${dm[i].content}`;
					embed.addField(`⠀`, `__**${dm[i].username}**__⠀⠀⠀${e.recent} \`${await tools.toLength(`${dm[i].time} ago`, 14)}\`⠀⠀⠀**${dm[i].title}**\n\`\`\`${text}\`\`\`${e.settings} \`Com ID: ${await tools.toLength(dm[i].messageId || 'error', 10, 'right')}\``);
				}
			}
			msg.edit(embed.setFooter('◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️'));

			let end = false;
			const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
			var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
			rc.on('collect', async resp => {
				end = true;
				const reaction = resp.emoji.name;
				if (reaction === '◀️') {
					if (pgP === 0) {
						pgP = 5;
						pg--;
					} else pgP = 0;
					msgLoop(pg, sent, pgP, msg);
					return;
				} else if (reaction === '▶️') {
					if (pgP === 5) {
						pgP = 0;
						pg++;
					} else pgP = 5;
					msgLoop(pg, sent, pgP, msg);
					return;
				} else if (resp.emoji.toString() === e.page) {
					await msg.clearReactions();
					const rQ = ['◀️', e.delete];
					let newQEmbed = new Discord.RichEmbed() //
						.setTitle(`${e.messages} Page ${pg * 2 + Math.floor(pgP / 5) + 1}⠀${e.page}`)
						.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
					msg.edit(newQEmbed);
					const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
					const filterQM = fMsg => fMsg.author.id === message.author.id;
					var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
					var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
					var found = false;
					rcQ.on('collect', respQ => {
						msgQ.stop();
						if (rQ[1] === respQ.emoji.toString()) msgLoop(0, sent, 0, msg);
						else msgLoop(pg, sent, pgP, msg);
					});
					msgQ.on('collect', async respQ => {
						found = true;
						rcQ.stop();
						respQ.delete();
						pg = parseInt(respQ.content) - 1;
						msgLoop(Math.floor(pg / 2), sent, (pg % 2) * 5, msg);
					});
					rcQ.on('end', async collectedQ => {
						if (found || collectedQ.size != 0) return;
						await msg.edit(new Discord.RichEmbed().setFooter(`Page selection timed out. Returning...`));
						msgLoop(pg, sent, pgP, msg);
					});
					for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
				} else if (resp.emoji.toString() === e.delete) {
					msg.delete();
					return;
				}
			});
			rc.on('end', collected => {
				end = true;
				if (collected.size != 0) return;
				// Delete the message and say so
				msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Display timed out.`));
				msg.clearReactions();
				return;
			});
			if (!end) if (pg > 0 || (pg == 0 && pgP == 5)) await msg.react('◀️');
			if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
			if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
			if (!end) await msg.react('▶️');
		}

		async function recieve(pg, pgP, sent) {
			let rpOptionsGetAll = {
				method: 'POST',
				uri: 'http://www.boomlings.com/database/getGJMessages20.php',
				form: {
					gameVersion: '21',
					binaryVersion: '35',
					gdw: '0',
					accountID: profile.accountID,
					gjp: ps,
					page: 0,
					total: '0',
					secret: 'Wmfd2893gb7',
				},
			};
			if (sent) rpOptionsGetAll.form.getSent = '1';

			let returned = await rp(rpOptionsGetAll);
			if (returned === '-1') return -1;
			if (returned === '-2') return -2;

			let comments = returned.split('|');
			let commentArray = [];
			comments = comments.slice(parseInt(pg) * 10 + pgP, parseInt(pg) * 10 + pgP + 5);

			for (i = 0; i < comments.length; i++) {
				let rpOptionsMsg = {
					method: 'POST',
					uri: 'http://www.boomlings.com/database/downloadGJMessage20.php',
					form: {
						gameVersion: '21',
						binaryVersion: '35',
						gdw: '0',
						accountID: profile.accountID,
						gjp: ps,
						messageID: comments[i].split(':')[7],
						secret: 'Wmfd2893gb7',
					},
				};
				if (sent) rpOptionsMsg.form.isSender = '1';

				let msgReturned = await rp(rpOptionsMsg);
				if (msgReturned === '-1') return -1;

				let msg = msgReturned.split(':');
				let messageFormat = {
					username: msg[1],
					playerId: msg[3],
					accountId: msg[5],
					messageId: msg[7],
					title: xor.b64from(msg[9]),
					8: msg[11],
					sentByUser: msg[13] == '1' ? true : false,
					content: xor.decrypt(msg[15], 14251),
					time: msg[17],
				};
				// 1 for GDoosh, 2 for GDBrowser, 3 for owns level, 4 for rob, 5 for elder mod, 0 for loser regular GD user.
				messageFormat.special = messageFormat.title.endsWith('★') ? 1 : messageFormat.title.endsWith('⍟') || messageFormat.title.endsWith('☆') ? 2 : 0;
				if (messageFormat.special !== 0) messageFormat.title = messageFormat.title.slice(0, -1);
				commentArray.push(messageFormat);
			}
			return commentArray;
		}
	} else if (['post', 'p', 'write', 'w', 'send', 's'].includes(args[1])) {
		let userMsg = await message.channel.send(`> Which user do you want to send this message to?`);
		let user = await question(userMsg);
		if (user === 'error') return;
		user = await gdtools.idAndUn(await gdtools.getPlayerID(user, user.content, bot));
		if (!user) return message.channel.send(`Cannot find this user!`);

		let subMsg = await message.channel.send(`> Please type your subject.`);
		let subject = await question(subMsg);
		if (subject === 'error') return;

		let contMsg = await message.channel.send(`> Please type your message.`);
		let content = await question(contMsg);
		if (content === 'error') return;

		let rpOptionsSend = {
			method: 'POST',
			uri: 'http://www.boomlings.com/database/uploadGJMessage20.php',
			form: {
				gameVersion: '21',
				binaryVersion: '35',
				gdw: '0',
				accountID: profile.accountID,
				gjp: ps,
				toAccountID: user[2],
				subject: xor.b64to(subject.content + '★'),
				body: xor.encrypt(content.content, 14251),
				secret: 'Wmfd2893gb7',
			},
		};

		let resp = await rp(rpOptionsSend);
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. Perhaps they are down, or check if you have cursed in your message?`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your send message request! Try again later, or verify your password is still up to date.');
		message.channel.send(`Your comment was successfully sent!`);

		async function question(msg) {
			return new Promise(async (resolve, reject) => {
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var msgcUser = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				msgcUser.on('collect', async resp => {
					msg.delete();
					resolve(resp);
				});
				msgcUser.on('end', async () => {
					msg.edit(`${msg.content}\nTime expired.`).catch(() => {});
					resolve('error');
				});
			});
		}
	} else if (['delete', 'del', 'd', 'r', 'remove', 'rem'].includes(args[1])) {
		if (!args[2]) return message.channel.send(`Please provide a messageId to delete!\nThis can be found next to the ${config.emojis.settings} emote when using \`${config.prefix}directmessages read\` command.`);

		let rpOptionsDel = {
			method: 'POST',
			uri: 'http://www.boomlings.com/database/deleteGJMessages20.php',
			form: {
				gameVersion: '21',
				binaryVersion: '35',
				gdw: '0',
				accountID: profile.accountID,
				gjp: ps,
				messageID: args[2].toString(),
				secret: 'Wmfd2893gb7',
			},
		};
		if (args[3] === 's') rpOptionsDel.form.isSender = '1';

		let resp = await rp(rpOptionsDel);
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. Perhaps they are down?`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your delete request! Try again later, or verify your password is still up to date.');
		message.channel.send(`The message was successfully deleted!`);
	} else return message.channel.send(`Valid types are \`read\`, \`send\`, or \`delete\``);
};

module.exports.config = {
	command: ['directmessages', 'directmessage', 'dm', 'private', 'privatemessage', 'pm', 'message', 'msg'],
	permlvl: 'All',
	help: ['Fun', 'Send a message to someone in Geometry Dash.', 'All', 'read (s)', "Read your Geometry Dash messages. If 's' is added, it will retrieve sent messages.", 'All', 'send', 'Send someone a Geometry Dash message.', 'All', 'delete [messageId] (s)', "Delete a Geometry Dash message. If 's' is added, it will delete a sent message."],
	helpg: '',
};
