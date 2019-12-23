const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const C = require('canvas');

module.exports.run = async (bot, message, args) => {
	var iconShow = args[1] == 'icon' || args[1] == 'i';
	var a = iconShow ? 2 : 1;
	let msg = await message.channel.send(`Finding user...`);
	if (!args[a]) args[a] = message.author.id;
	let player = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, a)), true);
	if (!player) return msg.edit(`Cannot find this user!`);
	let userId = await playersByPID.get(player[2]);
	if (userId) var user = await bot.users.get(userId);
	if (user) var ud = await userDescription.get(user.id);

	await msg.edit(`Looking at their profile information...`);
	let profile = await gdtools.profile(player[2]);
	await msg.edit(`Looking for their accurate CP count...`);
	let cpNew = await gdtools.requestCP(player[2]);
	let gamemodes = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
	profile.cube = profile.icon;
	let form = gamemodes[player[14]];
	if (iconShow) {
		await msg.edit(`Creating icon image...`);
		var iconSet = await gdtools.createIcons(profile);
	}

	await msg.edit(`Creating icon thumbnail...`);
	let iconSingle = await gdtools.createIcon(profile, form);

	let lbIcon = profile.rank > 1000 ? config.emojis.F : profile.rank > 500 ? config.emojis.E : profile.rank > 200 ? config.emojis.D : profile.rank > 100 ? config.emojis.C : profile.rank > 50 ? config.emojis.B : profile.rank > 10 ? config.emojis.A : config.emojis.S;
	let stats = '';
	if (profile.rank != 0) stats += `${lbIcon}  \`${profile.rank}\``;
	stats += `\n${config.emojis.gd_star}  \`${profile.stars}\``;
	stats += `\n${config.emojis.demons}  \`${profile.demons}\``;
	stats += `\n${config.emojis.coin_secret}  \`${profile.coins}\``;
	stats += `\n${config.emojis.coin_verified}  \`${profile.userCoins}\``;
	let stats2 = '';
	stats2 += `\n${config.emojis.diamond}  \`${profile.diamonds}\``;
	if (cpNew === undefined || cpNew == profile.cp) stats2 += `\n${config.emojis.cp}  \`${profile.cp}CP\``;
	else {
		stats2 += `\n${config.emojis.cp}  \`${cpNew}CP (Accurate)\``;
		stats2 += `\n${config.emojis.cp}  \`${profile.cp}CP (In-Game)\``;
	}
	stats2 += `\n${config.emojis.gdlb}  [GD Level Browser](https://gdbrowser.com/profile/${profile.username})`;
	stats2 += `\n${config.emojis.gdprofiles}  [GD Profiles](https://gdprofiles.com/${profile.username})`;
	let embed = new Discord.RichEmbed()
		.setAuthor(`${player[1]}`, `https://edoosh.github.io/Images/GD/Emojis/Profiles/mod_${profile.moderator}.png`) //
		.setDescription(user ? (ud ? ud : '(No user description provided)') : userId ? `This user is linked but their Discord information can not be found.` : `This user is not linked.`)
		.setThumbnail(`attachment://${profile.username}-Icon.png`)
		.addField(`${config.emojis.info} **User Statistics**`, stats, true)
		.addField(`⠀`, stats2, true)
		.addField(`${config.emojis.settings} **Community Settings**`, `${config.emojis.messages}  \`${profile.messages.replace(/^\w/, c => c.toUpperCase())}\`\n${config.emojis.friend_requests}  \`${profile.friendRequests ? 'Enabled' : 'Disabled'}\`\n${config.emojis.comment_history}  \`${profile.commentHistory.replace(/^\w/, c => c.toUpperCase())}\``)
		.setColor(`0x${profile.moderator == 0 ? '6aebc0' : profile.moderator == 1 ? 'ebe23f' : 'eb3f75'}`)
		.setFooter(`AccountID: ${profile.accountID}⠀⬥⠀PlayerID: ${profile.playerID}`);
	let sm = '';
	if (user) sm += `\n${config.emojis.discord}  ${user.tag}`;
	else if (userId) sm += `\n${config.emojis.discord}  ID: ${userId}`;
	if (profile.twitch && !profile.twitch.includes(' ')) sm += `\n${config.emojis.twitch}  [Twitch](https://www.twitch.tv/${profile.twitch})`;
	if (profile.twitter && !profile.twitter.includes(' ')) sm += `\n${config.emojis.twitter}  [Twitter](https://twitter.com/${profile.twitter})`;
	if (profile.youtube && !profile.youtube.includes(' ')) sm += `\n${config.emojis.youtube}  [YouTube](https://www.youtube.com/channel/${profile.youtube})`;
	if (sm.length > 0) embed.addField(`${config.emojis.social_media} **Social Media**`, sm, true);
	embed.attachFiles([iconSingle]);
	if (iconShow) {
		embed.attachFiles([iconSet]);
		embed.setImage(`attachment://${profile.username}-Icon-Set.png`);
	}
	msg.delete();
	message.channel.send({ embed });
};

module.exports.config = {
	command: ['profile', 'p', 'user', 'u'],
	permlvl: 'All',
	help: ['Fun', 'Get information about a user', 'All', '(icon) [gdRepresentable]', "Get information about the provided user. Type 'icon' at the start to get their icons.", 'All', '(icon)', "Get information about yourself, provided you are linked. Type 'icon' at the end to get your icons."],
	helpg: '',
};
