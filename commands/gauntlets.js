const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');

const gauntNames = ['', 'Fire Gauntlet', 'Ice Gauntlet', 'Poison Gauntlet', 'Shadow Gauntlet', 'Lava Gauntlet', 'Bonus Gauntlet', 'Chaos Gauntlet', 'Demon Gauntlet', 'Time Gauntlet', 'Crystal Gauntlet', 'Magic Gauntlet', 'Spike Gauntlet', 'Monster Gauntlet', 'Doom Gauntlet', 'Death Gauntlet'];
const gauntHex = ['', 'ff6400', '007dff', '00af00', '6400c8', 'c80000', '4b64ff', '646464', '323232', '0064ff', 'ff3296', '00327d', '966400', '004b00', '644b32', '323232'];

module.exports.run = async (bot, message, args) => {
	// Display list of all gauntlets
	if (!args[1]) {
		const e = config.emojis;
		let msg = await message.channel.send(new Discord.RichEmbed().setFooter('Creating a new message...'));
		showGauntlets(0, msg);
		async function showGauntlets(page, msg) {
			await msg.clearReactions();
			await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Retrieving gauntlets...`));
			let mpF = await getGauntlets(page);
			let mp = [];
			for (i = 0; i < 3; i++) mp.push(mpF[i + page * 3]);
			if (!mp[0] && page === 0) {
				msg.delete();
				let errorMsg = await message.channel.send(`No gauntlets found. Hmmm...`);
				errorMsg.delete(10000);
				return;
			}
			if (!mp[0]) {
				let errorMsg = await message.channel.send(`Error trying to get this page. Sending you back to page 1...`);
				errorMsg.delete(10000);
				showGauntlets(0, msg);
				return;
			}
			await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Constructing new embed...`));
			let listEmbed = new Discord.RichEmbed()
				.setTitle(`${e.search} Page ${page + 1}`)
				.setFooter(`◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️`)
				.setColor(`0x${mp[Math.floor(Math.random() * 3)].hex}`);
			for (const m of mp) {
				if (!m) continue;
				let title = [];
				let desc = [];
				title.push(`${e[m.name]} \`${await tools.toLength(m.id, 4, 'right')}\``);
				title.push(`**__${m.name}__**`);
				desc.push(`⠀ ⠀\`Lvls\``);
				desc.push(`*${m.lvls.split(',').join('*, *')}*`);
				listEmbed.addField(`⠀`, `${title.join('⠀⠀')}\n${desc.join('⠀⠀')}`);
			}
			msg.edit(listEmbed);
			const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
			var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
			rc.on('collect', async resp => {
				const reaction = resp.emoji.name;
				if (reaction === '◀️') {
					showGauntlets(page - 1, msg);
					return;
				} else if (reaction === '▶️') {
					showGauntlets(page + 1, msg);
					return;
				} else if (resp.emoji.toString() === e.page) {
					await msg.clearReactions();
					const rQ = ['◀️', e.delete];
					let newQEmbed = new Discord.RichEmbed() //
						.setTitle(`${e.search} Page ${page + 1}⠀${e.page}⠀*In-Game Page ${page + 1}*`)
						.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
					msg.edit(newQEmbed);
					const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
					const filterQM = fMsg => fMsg.author.id === message.author.id;
					var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
					var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
					var found = false;
					rcQ.on('collect', respQ => {
						msgQ.stop();
						if (rQ[1] === respQ.emoji.toString()) showGauntlets(0, msg);
						else showGauntlets(page, msg);
					});
					msgQ.on('collect', async respQ => {
						found = true;
						rcQ.stop();
						respQ.delete();
						showGauntlets(parseInt(respQ.content) - 1, msg);
					});
					rcQ.on('end', async collectedQ => {
						if (found || collectedQ.size != 0) return;
						let errorMsg = await message.channel.send(`Page selection timed out. Returning...`);
						errorMsg.delete(10000);
						showGauntlets(page, msg);
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
			if (page > 0) await msg.react('◀️');
			await msg.react(e.page.replace(/[<>]/g, ''));
			await msg.react(e.delete.replace(/[<>]/g, ''));
			if (mp[mp.length - 1] !== undefined && mpF.length !== (page + 1) * 3) await msg.react('▶️');
		}
	}
	// Get levels in gauntlet
	else {
		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Finding Gauntlet...`));
		let search = await tools.getArgs(args, 1);
		let newGauntlet = await getGauntlets();
		if (!newGauntlet) return msg.edit(`Could not find any gauntlets on the servers...`);
		for (j = 0; j < newGauntlet.length; j++) {
			if (newGauntlet[j].id == search || newGauntlet[j].name.toLowerCase() == search.toLowerCase() || newGauntlet[j].name.toLowerCase() == `${search.toLowerCase()} gauntlet`) {
				var foundG = newGauntlet[j];
				break;
			}
		}
		if (!foundG) return msg.edit(`Could not find this Gauntlet!`);
		await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Getting level information...`));
		let lvls = await gdtools.searchLevel('*', { gauntlet: foundG.id });
		await msg.edit(
			(await gdtools.createListEmbed(lvls))
				.setColor(`0x${foundG.hex}`)
				.setTitle(`${config.emojis.search} __**${foundG.name}**__`)
				.setThumbnail(`https://edoosh.github.io/Images/GD/Emojis/Gauntlets/${foundG.name.slice(0, foundG.name.indexOf(' ')).toLowerCase()}.png`),
		);
	}
};

async function getGauntlets() {
	let resp = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJGauntlets21.php', form: { gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: '0', secret: regData.secret } });
	if (!resp || resp == '-1' || resp.startsWith('#')) return;
	let gauntletU = resp.split('#')[0].split('|');
	let gauntlets = await gauntletU.map(x => {
		let response = x.split('#')[0].split(':');
		let res = {};
		for (let i = 0; i < response.length; i += 2) res[response[i]] = response[i + 1];
		return res;
	});
	await gauntlets.forEach(async (x, y) => {
		let keys = Object.keys(x);

		x.id = x[1];
		x.name = gauntNames[x[1]];
		x.lvls = x[3];
		x.hex = gauntHex[x[1]];

		keys.forEach(k => delete x[k]);
	});
	return gauntlets;
}

module.exports.config = {
	command: ['g', 'gaunt', 'gauntlet', 'gauntlets'],
	permlvl: 'All',
	help: ['Fun', 'Show all gauntlets, or get a list of gauntlets.', 'All', '', 'Display all gauntlets.', 'All', '[GauntletID | GauntletName]', 'Display all the levels in the given gauntlet.'],
	helpg: '',
};
