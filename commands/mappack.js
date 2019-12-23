const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	// Display list of all mappacks
	if (!args[1]) {
		const e = config.emojis;
		let msg = await message.channel.send(new Discord.RichEmbed().setFooter('Creating a new message...'));
		showMapPacks(0, msg, 0);
		async function showMapPacks(page, msg, zf) {
			await msg.clearReactions();
			await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Retrieving mappacks...`));
			let mpF = await getMapPacks(page);
			let mp = [];
			for (i = 0; i < 5; i++) mp.push(mpF[i + zf]);
			if (mpF == '-1' && page === 0 && zf === 0) {
				msg.delete();
				let errorMsg = await message.channel.send(`No mappacks found. Hmmm...`);
				errorMsg.delete(10000);
				return;
			}
			if (mpF == '-1' || mp[0] == undefined) {
				let errorMsg = await message.channel.send(`There was an error retrieving this page. Returning you to page 1.`);
				page = 0;
				errorMsg.delete(10000);
				showMapPacks(page, msg, 0);
				return;
			}
			await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Constructing new embed...`));
			let listEmbed = new Discord.RichEmbed()
				.setTitle(`${e.search} Page ${page * 2 + (zf === 0 ? 1 : 2)}⠀${e.page}⠀*In-Game Page ${page + 1}*`)
				.setFooter(`◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️`)
				.setColor(`0x${mp[Math.floor(Math.random() * 5)].hex}`);
			for (const m of mp) {
				if (!m) continue;
				if (m.diff == 0) var mpImg = e.na;
				else if (m.diff == 1) var mpImg = e.easy;
				else if (m.diff == 2) var mpImg = e.normal;
				else if (m.diff == 3) var mpImg = e.hard;
				else if (m.diff == 4) var mpImg = e.harder;
				else if (m.diff == 5) var mpImg = e.insane;
				else if (m.diff == 6) var mpImg = e.hard_demon;
				let coinOut = '';
				for (i = 0; i < parseInt(m.coins); i++) coinOut += `${e.coin_secret} `;
				let title = [];
				let desc = [];
				title.push(`:id: \`${await tools.toLength(m.id, 3, 'right')}\``);
				title.push(`**__${m.name}__**`);
				title.push(`${coinOut}`);
				desc.push(`${mpImg} \`${await tools.toLength(`${m.stars}*`, 3, 'right')}\``);
				desc.push(`**${m.lvls.split(',').join('**, **')}**`);
				listEmbed.addField(`⠀`, `${title.join('⠀⠀')}\n${desc.join('⠀⠀')}`);
			}
			msg.edit(listEmbed);
			const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
			var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
			rc.on('collect', async resp => {
				const reaction = resp.emoji.name;
				if (reaction === '◀️') {
					if (zf === 0) {
						page--;
						zf = 5;
					} else zf = 0;
					showMapPacks(page, msg, zf);
					return;
				} else if (reaction === '▶️') {
					if (zf === 5) {
						page++;
						zf = 0;
					} else zf = 5;
					showMapPacks(page, msg, zf);
					return;
				} else if (resp.emoji.toString() === e.page) {
					await msg.clearReactions();
					const rQ = ['◀️', e.delete];
					let newQEmbed = new Discord.RichEmbed() //
						.setTitle(`${e.search} Page ${page * 2 + (zf === 0 ? 1 : 2)}⠀${e.page}⠀*In-Game Page ${page + 1}*`)
						.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
					msg.edit(newQEmbed);
					const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
					const filterQM = fMsg => fMsg.author.id === message.author.id;
					var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
					var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
					var found = false;
					rcQ.on('collect', respQ => {
						msgQ.stop();
						if (rQ[1] === respQ.emoji.toString()) showMapPacks(0, msg, 0);
						else showMapPacks(page, msg, zf);
					});
					msgQ.on('collect', async respQ => {
						found = true;
						rcQ.stop();
						respQ.delete();
						showMapPacks(Math.floor((parseInt(respQ.content) - 1) / 2), msg, (parseInt(respQ.content) - 1) % 2);
					});
					rcQ.on('end', async collectedQ => {
						if (found || collectedQ.size != 0) return;
						let errorMsg = await message.channel.send(`Page selection timed out. Returning...`);
						errorMsg.delete(10000);
						showMapPacks(page, msg, zf);
					});
					for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
				} else if (resp.emoji.toString() === e.delete) {
					msg.delete();
					return;
				}
			});
			rc.on('end', collected => {
				if (collected.size != 0) return;
				// Delete the message and say so
				message.channel.send(`Display timed out.`);
				msg.clearReactions();
				return;
			});
			if (page > 0 || zf === 5) await msg.react('◀️');
			await msg.react(e.page.replace(/[<>]/g, ''));
			await msg.react(e.delete.replace(/[<>]/g, ''));
			if (mp[mp.length - 1] !== undefined) await msg.react('▶️');
		}
	}
	// Get levels in mappack
	else {
		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Finding MapPack...`));
		let i = -1;
		let search = await tools.getArgs(args, 1);
		while (!foundPack) {
			i++;
			let newPack = await getMapPacks(i);
			if (!newPack) break;
			for (j = 0; j < newPack.length; j++) {
				if (newPack[j].id == search || newPack[j].name.toLowerCase() == search.toLowerCase() || newPack[j].name.toLowerCase() == `${search.toLowerCase()} pack`) {
					var foundPack = newPack[j];
					break;
				}
			}
		}
		if (!foundPack) return msg.edit(`Could not find this MapPack!`);
		await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Getting level information...`));
		let lvls = await gdtools.searchLevel(foundPack.lvls, { mappack: true });
		await msg.edit((await gdtools.createListEmbed(lvls)).setColor(`0x${foundPack.hex}`).setTitle(`${config.emojis.search} __**${foundPack.name}**__`));
	}
};

async function getMapPacks(page) {
	let resp = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJMapPacks21.php', form: { page: page, secret: regData.secret } }).catch(() => console.log(cErrMsg(`Issue retrieving MapPacks. GD Servers likely experiencing issues.`)));
	if (!resp || resp == '-1' || resp.startsWith('#')) return;
	let mpU = resp.split('#')[0].split('|');
	let mappacks = await mpU.map(x => {
		let response = x.split('#')[0].split(':');
		let res = {};
		for (let i = 0; i < response.length; i += 2) {
			res[response[i]] = response[i + 1];
		}
		return res;
	});
	await mappacks.forEach(async (x, y) => {
		let keys = Object.keys(x);

		x.id = x[1];
		x.name = x[2];
		x.lvls = x[3];
		x.stars = x[4];
		x.coins = x[5];
		x.diff = x[6];
		x.color = x[7];

		// https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
		var rgbToHex = rgb => {
			var hex = Number(rgb).toString(16);
			if (hex.length < 2) hex = '0' + hex;
			return hex;
		};
		var fullColorHex = (r, g, b) => {
			var red = rgbToHex(r);
			var green = rgbToHex(g);
			var blue = rgbToHex(b);
			return red + green + blue;
		};
		let xColSplit = x.color.split(',');
		x.hex = fullColorHex(xColSplit[0], xColSplit[1], xColSplit[2]);

		keys.forEach(k => delete x[k]);
	});
	return mappacks;
}

module.exports.config = {
	command: ['mp', 'map', 'mappack', 'mappacks', 'pack', 'packs'],
	permlvl: 'All',
	help: ['Fun', 'Show all mappacks, or get a list of mappacks.', 'All', '', 'Display all mappacks.', 'All', '[MapPackID | MapPackName]', 'Display all the levels in the given mappack.'],
	helpg: 'generalCommandSyntax',
};
