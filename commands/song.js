const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const lvls = require('../functions/levels.json').music;

module.exports.run = async (bot, message, args) => {
	if (!args[1] || (!/[0-9]/.test(args[1]) && args[1] !== 'l' && args[1] !== 'list')) return tools.errMsg(bot, message, args, 1, 'No Song ID provided');
	if (args[1] === 'l' || args[1] === 'list') {
		let list = [[], [], [], [], []];
		for (i = 0; i < lvls.length; i++) {
			let l = lvls[i];
			let toAdd = `\`${await tools.toLength(`${i}`, 2, 'right')}\`⠀ \`${await tools.toLength(l[0], 22)}\`⠀by⠀\`${await tools.toLength(l[1], 12)}\`\n`;
			if (l[5] === 0 && list[0].length + toAdd.length > 1024) l[5] = 4;
			list[l[5]] += toAdd;
		}
		return message.channel.send(
			new Discord.RichEmbed()
				.setTitle(`List of Geometry Dash Official Songs`)
				.addField(`**Geometry Dash**`, list[0])
				.addField(`⠀`, list[4])
				.addField(`**GD Meltdown**`, list[1])
				.addField(`**GD World**`, list[2])
				.addField(`**GD SubZero**`, list[3])
				.setColor(0x34ebd5),
		);
	}
	let cust = parseInt(args[1]);
	let official = 0;
	if (args[2] === 'o') {
		cust = 0;
		official = parseInt(args[1]);
	}
	if (args[cust === 0 ? 3 : 2] === 'd') {
		var download = true;
		var downloadMsg = await message.channel.send(`Downloading song...`);
	}
	let data = await gdtools.getSong({ customSong: cust, officialSong: official });
	if (!data) return tools.errMsg(bot, message, args, 1, 'Invalid Song ID');
	if (!data.id.startsWith('Level ')) var fDesc = `${config.emojis.newgrounds} [Newgrounds Audio](https://www.newgrounds.com/audio/listen/${data.id})\n:floppy_disk: ${data.size}`;
	else var fDesc = `This song is not available on Newgrounds, and so no further information can be provided.`;
	let embed = new Discord.RichEmbed()
		.setTitle(`${config.emojis.music_note} **__${await tools.cleanR(data.name)}__**`)
		.setColor(`0x${['f53131', 'f58331', 'f5e131', '89f531', '31f579', '31f5e1', '31aaf5', '4062f7', '6a42ed', 'ad52f7', 'e540f7', 'f531c4', 'f0325b'][Math.floor(Math.random() * 13)]}`)
		.addField(`By **__${data.author}__**`, `:id: ${data.id}\n${fDesc}`);
	if (download) {
		if (!data.link) {
			downloadMsg.delete();
			return message.channel.send(`Could not get link to download song. This likely means that you may not use this song in game.`, embed);
		}
		if (parseInt(data.size) > 7.9) {
			downloadMsg.delete();
			return message.channel.send(`This song is too large to upload to Discord!`, embed);
		}
		let m = await rp({ uri: data.link, encoding: null });
		let b = Buffer.from(m, 'utf8');
		let att = new Discord.Attachment(b, `${await tools.cleanR(data.name)}_-_-_${data.author}.mp3`);
		embed.attachFile(att);
		await downloadMsg.edit(`Uploading song...`);
	}
	await message.channel.send(embed);
	if (downloadMsg) downloadMsg.delete();
};

module.exports.config = {
	command: ['song', 'si', 'sd', 'songinfo', 'songdata', 'songid'],
	permlvl: 'All',
	help: ['Fun', 'Find information about a song from its Song ID', 'All', '[songId] (o) (d)', "Find information about a song from its Song ID. If (o) is provided, it will get it based on that song's Official ID. 1 being Stereo Madness, 2 being Back on Track, etc. If (d) is provided, it will download and attach the song to the embed.", 'All', 'l', 'Lists all official songs with their games and Official Song IDs'],
	helpg: '',
};
