const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const XOR = require('../functions/XOR.js');
const gdtools = require('../functions/gdFunctions.js');
const xor = new XOR();
const rp = require('request-promise');

// All friends list
// Show friend requests (s)
// Accept friend request
// Remove friend request (s)

module.exports.run = async (bot, message, args) => {
	const pId = await playersByUID.get(message.author.id);
	if (!pId) return message.channel.send(`Please link up your account using \`${config.prefix}link\``);
	let ps = await passwords.get(message.author.id);
	if (!ps) return message.channel.send(`Please link up your password using \`${config.prefix}pass\``);
	ps = xor.encrypt(ps, 37526);
	const profile = await gdtools.profile(pId);
	if (!profile) return message.channel.send(`Sorry, there was an issue getting your profile information!`);
	if (!args[1] || ['friend', 'friends', 'f', 'a', 'all', 'l', 'list'].includes(args[1])) {
		const b = 5;
		if (!message.guild) return message.channel.send(`This sub-command may only be used in servers, due to Discord limitations.`);
		const e = config.emojis;
		message.delete();

		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Beginning Friends Search...`));
		let fr = await getFriends();
		if (!fr) return msg.edit(new Discord.RichEmbed().setFooter(`Error retrieving friends list. The GD servers might be down, or check your password is up to date.`));
		// page, fr, msg
		msgLoop(0, fr, msg);

		async function msgLoop(pg, fr, msg) {
			msg.clearReactions();
			let embed = new Discord.RichEmbed()
				.setColor(0x42e3f5)
				.setTitle(`__${profile.username}'s__ Friends List`)
				.setAuthor(`Page ${pg + 1}`, `https://edoosh.github.io/Images/GD/Emojis/Profiles/social_media.png`);
			let dm = fr.slice(pg * b, pg * b + b);
			if (!dm || dm == '-1' || !dm[0]) embed.addField(`Error`, `An error occured while getting this page of friend requests.`);
			else {
				for (i = 0; i < dm.length; i++) {
					let pData = await gdtools.profile(dm[i].playerId);
					let text = [];
					text.push(`**${pData.username}**`);
					text.push(`${e.gd_star} \`${await tools.toLength(pData.stars, 6)}\``);
					text.push(`${e.cp} \`${await tools.toLength(pData.cp, 6)}\``);
					text.push(`\n${e.demons} \`${await tools.toLength(pData.demons, 6)}\``);
					text.push(`${e.diamond} \`${await tools.toLength(pData.diamonds, 6)}\``);
					text.push(`${e.coin_secret} \`${await tools.toLength(pData.coins, 3)}\``);
					text.push(`${e.coin_verified} \`${await tools.toLength(pData.userCoins, 6)}\``);
					embed.addField(`⠀`, text.join('⠀⠀⠀'));
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
					msgLoop(pg - 1, fr, msg);
					return;
				} else if (reaction === '▶️') {
					msgLoop(pg + 1, fr, msg);
					return;
				} else if (resp.emoji.toString() === e.page) {
					await msg.clearReactions();
					const rQ = ['◀️', e.delete];
					let newQEmbed = new Discord.RichEmbed() //
						.setTitle(`${e.social_media} Page ${pg}⠀${e.page}`)
						.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
					msg.edit(newQEmbed);
					const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
					const filterQM = fMsg => fMsg.author.id === message.author.id;
					var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
					var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
					var found = false;
					rcQ.on('collect', respQ => {
						msgQ.stop();
						if (rQ[1] === respQ.emoji.toString()) msgLoop(0, fr, msg);
						else msgLoop(pg, fr, msg);
					});
					msgQ.on('collect', async respQ => {
						found = true;
						rcQ.stop();
						respQ.delete();
						msgLoop(parseInt(respQ.content) - 1, fr, msg);
					});
					rcQ.on('end', async collectedQ => {
						if (found || collectedQ.size != 0) return;
						await msg.edit(new Discord.RichEmbed().setFooter(`Page selection timed out. Returning...`));
						msgLoop(pg, fr, msg);
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
			if (!end) if (pg !== 0) await msg.react('◀️');
			if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
			if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
			if (!end) if (pg < Math.ceil(fr.length / b)) await msg.react('▶️');
		}

		async function getFriends() {
			let form = {
				gameVersion: '21',
				binaryVersion: '35',
				gdw: '0',
				accountID: profile.accountID,
				gjp: ps,
				type: 0,
				secret: 'Wmfd2893gb7',
			};
			let resp = await rp({
				method: 'POST',
				uri: 'http://www.boomlings.com/database/getGJUserList20.php',
				form: form,
			});
			if (resp == '-1') return undefined;
			let split = resp.split(/\#/)[0].split(/\|/);
			let format = [];
			for (i = 0; i < split.length; i++) {
				let x = await gdtools.parseResponse(split[i], ':');
				let y = {};
				y.username = x[1];
				y.playerId = x[2];
				y.accountId = x[16];
				y.icon = x[9]; // The icon of the form chosen.
				y.col1 = x[10];
				y.col2 = x[11];
				y.form = x[14];
				y[15] = x[15]; // idk
				y[18] = x[18]; // same for this
				format.push(y);
			}
			return format;
		}
	} else if (['remfriend', 'rf', 'removefriend', 'df', 'delfriend', 'deletefriend'].includes(args[1])) {
		let userMsg = await message.channel.send(`> Which user do you want to remove as a friend?`);
		let user = await question(userMsg);
		if (user === 'error') return;
		user = await gdtools.idAndUn(await gdtools.getPlayerID(user, user.content, bot));
		if (!user) return message.channel.send(`Cannot find this user!`);

		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile.accountID,
			targetAccountID: user[2],
			gjp: ps,
			secret: 'Wmfd2893gb7',
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/removeGJFriend20.php',
			form: form,
		}).catch(() => {
			return undefined;
		});
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. The servers may be down.`);
		if (resp == '-1') return message.channel.send("The Geometry Dash servers rejected your friend removal! Try again later, verify your password is still up to date, or check if you're friends with that user.");
		message.channel.send(`Successfully removed user from your friends!`);
	} else if (['friendreqs', 'friendrequests', 'fr', 'reqs', 'r', 'requests'].includes(args[1])) {
		if (!message.guild) return message.channel.send(`This sub-command may only be used in servers, due to Discord limitations.`);
		const e = config.emojis;
		message.delete();

		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Beginning Friend Request Search...`));
		// page, sent?, page+, msg
		msgLoop(0, args[2] === 's', 0, msg);

		async function msgLoop(pg, sent, pgP, msg) {
			msg.clearReactions();
			let embed = new Discord.RichEmbed()
				.setColor(0x42e3f5)
				.setTitle(`__${profile.username}'s__⠀${sent ? 'Sent' : 'Recieved'} Friend Requests`)
				.setAuthor(`Page ${pg * 4 + Math.floor(pgP / 5) + 1}`, `https://edoosh.github.io/Images/GD/Emojis/Profiles/friend_requests.png`);
			let dm = await recieve(pg, pgP, sent);
			if (dm == '-1' || !dm || !dm[0]) embed.addField(`Error`, `An error occured while getting this page of friend requests.`);
			else {
				for (i = 0; i < dm.length; i++) {
					let text = `${dm[i].content.length === 0 ? 'brainfuck' : dm[i].special === 0 ? '' : dm[i].special === 1 ? 'diff' : 'glsl'}\n${dm[i].special === 1 ? '- ' : dm[i].special === 2 ? '# ' : ''}${dm[i].content || '(No message provided)'}`;
					embed.addField(`⠀`, `__**${dm[i].username}**__⠀⠀⠀${e.recent} \`${await tools.toLength(`${dm[i].time} ago`, 14)}\`⠀⠀⠀\n\`\`\`${text}\`\`\`${e.settings} \`ReqID ID: ${await tools.toLength(dm[i].friendRequestId || 'error', 10, 'right')}\``);
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
						pgP = 15;
						pg--;
					} else pgP -= 5;
					msgLoop(pg, sent, pgP, msg);
					return;
				} else if (reaction === '▶️') {
					if (pgP === 15) {
						pgP = 0;
						pg++;
					} else pgP += 5;
					msgLoop(pg, sent, pgP, msg);
					return;
				} else if (resp.emoji.toString() === e.page) {
					await msg.clearReactions();
					const rQ = ['◀️', e.delete];
					let newQEmbed = new Discord.RichEmbed() //
						.setTitle(`${e.friend_requests} Page ${pg * 4 + Math.floor(pgP / 5) + 1}⠀${e.page}`)
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
						msgLoop(Math.floor(pg / 4), sent, (pg % 4) * 5, msg);
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
			if (!end) if (!(pg == 0 && pgP === 0)) await msg.react('◀️');
			if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
			if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
			if (!end) if (dm.length === 5) await msg.react('▶️');
		}

		async function recieve(page, pgP, sent) {
			let format = await fr(page, sent);
			format = format.slice(pgP, pgP + 5);
			return format;
		}
	} else if (['accept', 'acc', 'acceptrequest', 'acceptfriendrequest', 'af', 'ar', 'acceptfriend', 'addfriend',].includes(args[1])) {
		let userMsg = await message.channel.send(`> Which user's friend request do you want to accept?`);
		let user = await question(userMsg);
		if (user === 'error') return;
		user = await gdtools.idAndUn(await gdtools.getPlayerID(user, user.content, bot));
		if (!user) return message.channel.send(`Cannot find this user!`);

		let i = 0;
		while (true) {
			let page = await fr(i, false);
			if (!page || page == '-1' || !page[0]) break;
			for (j = 0; j < page.length; j++) {
				if (page[j].accountId === user[2]) {
					var frId = page[j].friendRequestId;
					break;
				}
			}
			if (frId) break;
			i++;
		}

		if (!frId) return message.channel.send(`Could not find a friend request from this user.`);

		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile.accountID,
			targetAccountID: user[2],
			gjp: ps,
			requestID: frId,
			secret: 'Wmfd2893gb7',
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/acceptGJFriendRequest20.php',
			form: form,
		}).catch(() => {
			return undefined;
		});
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. The servers may be down.`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your friend request accept request! Try again later, verify your password is still up to date, or check if that user has sent you a friend request.');
		message.channel.send(`The friend request was successfully accepted!`);
	} else if (['remove', 'rem', 'r', 'del', 'delete', 'deny', 'd', 'removefriendrequest', 'denyfriendrequest', 'deletefriendrequest', 'removerequest', 'denyrequest', 'deleterequest'].includes(args[1])) {
		let userMsg = await message.channel.send(`> Which user's friend request do you want to remove?`);
		let user = await question(userMsg);
		if (user === 'error') return;
		user = await gdtools.idAndUn(await gdtools.getPlayerID(user, user.content, bot));
		if (!user) return message.channel.send(`Cannot find this user!`);

		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile.accountID,
			targetAccountID: user[2],
			gjp: ps,
			isSender: ['s', 'sender'].includes(args[2]) ? '1' : '0',
			secret: 'Wmfd2893gb7',
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/deleteGJFriendRequests20.php',
			form: form,
		}).catch(() => {
			return undefined;
		});
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. The servers may be down.`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your friend request remove request! Try again later, verify your password is still up to date, or check if that user has sent you a friend request.');
		message.channel.send(`The friend request was successfully removed!`);
	} else if (['send', 's', 'request'].includes(args[1])) {
		let userMsg = await message.channel.send(`> Which user do you want to send a friend request to?`);
		let user = await question(userMsg);
		if (user === 'error') return;
		user = await gdtools.idAndUn(await gdtools.getPlayerID(user, user.content, bot));
		if (!user) return message.channel.send(`Cannot find this user!`);

		let subMsg = await message.channel.send(`> Please type your message.`);
		let content = await question(subMsg);
		if (content === 'error') return;

		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile.accountID,
			toAccountID: user[2],
			gjp: ps,
			comment: xor.b64to(content.content + '★'),
			secret: 'Wmfd2893gb7',
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/uploadFriendRequest20.php',
			form: form,
		}).catch(() => {
			return undefined;
		});
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. The servers may be down, you could have cursed in your message, or you have already sent a friend request to this person.`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your friend request request! Try again later, verify your password is still up to date, or check if that user has friend requests enabled.');
		message.channel.send(`Your friend request was successfully sent!`);
	} else return message.channel.send(`Valid types are \`all\`, \`removefriend\`, \`friendrequests\`, \`accept\`, \`deny\`, or \`send\``);

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
	async function fr(page, sent) {
		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile.accountID,
			gjp: ps,
			page: page.toString(),
			secret: 'Wmfd2893gb7',
		};
		if (sent) form.getSent = '1';
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/getGJFriendRequests20.php',
			form: form,
		});
		if (resp == '-1') return -1;
		let split = resp.split(/\#/)[0].split(/\|/);
		let format = [];
		for (i = 0; i < split.length; i++) {
			let x = await gdtools.parseResponse(split[i], ':');
			if (!x[35]) continue;
			let y = {};
			y.username = x[1];
			y.playerId = x[2];
			y.accountId = x[16];
			y.icon = x[9]; // The icon of the form chosen.
			y.col1 = x[10];
			y.col2 = x[11];
			y.form = x[14];
			y[15] = x[15]; // idk
			y[41] = x[41]; // and this
			y.friendRequestId = x[32];
			y.content = xor.b64from(x[35].toString() || '');
			y.time = x[37];
			// 1 for GDoosh, 2 for GDBrowser, 0 for loser regular GD user.
			y.special = y.content.endsWith('★') ? 1 : y.content.endsWith('⍟') || y.content.endsWith('☆') ? 2 : 0;
			if (y.special !== 0) y.content = y.content.slice(0, -1);
			format.push(y);
		}
		return format;
	}
};

module.exports.config = {
	command: ['friends', 'f', 'friend', 'fr', 'friendrequests'],
	permlvl: 'All',
	help: ['Fun', 'Send, view, accept, and deny friend requests. List and remove friends from your friends list.',
			'All', 'all', "View all your in-game friends.",
			'All', 'removefriend', 'Remove someone from your friends list.',
			'All', 'friendrequests (s)', "View all your recieved friend requests. If 's' is added, view all your sent friend requests.",
			'All', 'accept', 'Accept a players friend request',
			'All', 'remove (s)', 'Remove a players friend request. If \'s\' is added, remove a sent friend request.',
			'All', 'send', 'Send a friend request to a player.'],
	helpg: '',
};
