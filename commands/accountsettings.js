const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const XOR = require('../functions/XOR.js');
const xor = new XOR();

module.exports.run = async (bot, message, args) => {
	let pId = await playersByUID.get(message.author.id);
	if (!pId) return message.channel.send(`Please link up your account using \`${config.prefix}link\``);
	let profile = await gdtools.profile(pId);
	if (!profile) return message.channel.send(`Sorry, there was an issue getting your profile information!`);
	if (!args[1]) {
		let embed = new Discord.RichEmbed() //
			.setAuthor(`${profile.username}'s Account Settings`, 'https://edoosh.github.io/Images/GD/Emojis/Profiles/settings.png')
			.addField(`${config.emojis.profile} **Community Settings**`, `${config.emojis.messages}  \`${profile.messages.replace(/^\w/, c => c.toUpperCase())}\`\n${config.emojis.friend_requests}  \`${profile.friendRequests ? 'Enabled' : 'Disabled'}\`\n${config.emojis.comment_history}  \`${profile.commentHistory.replace(/^\w/, c => c.toUpperCase())}\``);
		let sm = '';
		sm += `\n${config.emojis.discord}  ${message.author.tag}`;
		if (profile.twitch && !profile.twitch.includes(' ')) sm += `\n${config.emojis.twitch}  [Twitch](https://www.twitch.tv/${profile.twitch})`;
		if (profile.twitter && !profile.twitter.includes(' ')) sm += `\n${config.emojis.twitter}  [Twitter](https://twitter.com/${profile.twitter})`;
		if (profile.youtube && !profile.youtube.includes(' ')) sm += `\n${config.emojis.youtube}  [YouTube](https://www.youtube.com/channel/${profile.youtube})`;
		if (sm.length > 0) embed.addField(`${config.emojis.social_media} **Social Media**`, sm, true);
		message.channel.send(embed.setColor(0x75f542));
	} else {
		let ps = await passwords.get(message.author.id);
		if (!ps) return message.channel.send(`Please link up your password using \`${config.prefix}pass\``);
		let settings;
		if (args[1] === 'messages') {
			let index = ['all', 'friends', 'none'].indexOf(args[2]);
			if (index === undefined) return message.channel.send(`Invalid messages type.`);
			settings = { allowMessagesFrom: index };
		} else if (args[1] === 'friends') {
			let index = ['all', 'none'].indexOf(args[2]);
			if (index === undefined) return message.channel.send(`Invalid friends type.`);
			settings = { friendRequestsFrom: index };
		} else if (args[1] === 'comments') {
			let index = ['all', 'friends', 'none'].indexOf(args[2]);
			if (index === undefined) return message.channel.send(`Invalid comments type.`);
			settings = { showCommentHistoryTo: index };
		} else if (args[1] === 'yt') settings = { youtube: args[2] || '' };
		else if (args[1] === 'twitter') settings = { twitter: args[2] || '' };
		else if (args[1] === 'twitch') settings = { twitch: args[2] || '' };
		else return message.channel.send(`Invalid settings type.`);
		let resp = await updateSettings(profile, ps, settings);
		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. Perhaps they are down?`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your comment! Try again later, or verify your password is still up to date.');
		message.channel.send(`Settings successfully updated!`);
	}
	async function updateSettings(un, ps, settings = {}) {
		ps = xor.encrypt(ps, 37526);

		let form = {
			accountID: un.accountID,
			gjp: ps,
			mS: un.messages === 'all' ? '0' : un.messages === 'friends' ? '1' : '2',
			frS: un.friendRequests === 'false' ? '1' : '0',
			cS: un.commentHistory === 'all' ? '0' : un.messages === 'friends' ? '1' : '2',
			yt: un.youtube === null ? '' : un.youtube,
			twitter: un.twitter === null ? '' : un.twitter,
			twitch: un.twitch === null ? '' : un.twitch,
			secret: 'Wmfv3899gc9',
		};

		if (settings.hasOwnProperty('allowMessagesFrom')) {
			let allowMessagesFrom = parseInt(settings.allowMessagesFrom);
			if (allowMessagesFrom <= 2 && allowMessagesFrom >= 0) form.mS = allowMessagesFrom.toString();
		}
		if (settings.hasOwnProperty('friendRequestsFrom')) {
			let friendRequestsFrom = parseInt(settings.friendRequestsFrom);
			if (friendRequestsFrom <= 1 && friendRequestsFrom >= 0) form.frS = friendRequestsFrom.toString();
		}
		if (settings.hasOwnProperty('showCommentHistoryTo')) {
			let showCommentHistoryTo = parseInt(settings.showCommentHistoryTo);
			if (showCommentHistoryTo <= 2 && showCommentHistoryTo >= 0) form.cS = showCommentHistoryTo.toString();
		}
		if (settings.hasOwnProperty('youtube')) form.yt = settings.youtube.toString();
		if (settings.hasOwnProperty('twitter')) form.twitter = settings.twitter.toString();
		if (settings.hasOwnProperty('twitch')) form.twitch = settings.twitch.toString();

		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/updateGJAccSettings20.php',
			form: form,
		});
		return resp;
	}
};

module.exports.config = {
	command: ['accountsettings', 'updatesettings', 'accsettings', 'as', 'us'],
	permlvl: 'All',
	help: ['Fun', 'View / Change your account settings.', 'All', '', 'View your current account settings.', 'All', 'messages [all | friends | none]', 'Update who can send you messages.', 'All', 'friends [all | none]', 'Update who can send you friend requests.', 'All', 'comments [all | friends | none]', 'Update who can view your comment history.', 'All', 'yt', 'Update your YouTube link.', 'All', 'twitter', 'Update your Twitter handle.', 'All', 'twitch', 'Update your Twitch username.'],
	helpg: 'generalCommandSyntax',
};
