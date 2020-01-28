/**
 * Returns a string between two specified arguments.
 * @param {Array.<string>} args The arguments array to use.
 * @param {number} startArg The beginning argument to use.
 * @param {number} endArg DEFAULT: args.length | The ending argument to use (inclusive)
 * @returns {string} All of the combined arguments.
 */
module.exports.getArgs = async (args, startArg, endArg) => {
	if (args.length < startArg) return new Promise((resolve, reject) => resolve(undefined));
	if (!endArg) endArg = args.length - 1;
	let returnValue = args[startArg];
	for (i = startArg + 1; i <= endArg && i < args.length; i++) {
		returnValue += ` ${args[i]}`;
	}
	return new Promise((resolve, reject) => resolve(returnValue));
};

/**
 * Retrieves a user collection. Mention - UserID - Username - UserTag
 * @param {collection} message The message collection.
 * @param {string} userSearch The string to try and match for.
 * @param {boolean} returnSelf DEFAULT: FALSE | Whether or not to return the author if no values are found.
 * @return {collection} The collection of the user.
 */
module.exports.getUser = async (message, userSearch, bot, returnSelf = false) => {
	return new Promise(async (resolve, reject) => {
		resolve((await message.mentions.users.first()) || (await bot.users.find(user => user.id === userSearch)) || (await bot.users.find(user => user.username === userSearch)) || (await bot.users.find(user => user.tag === userSearch)) || (returnSelf === true ? message.author : undefined));
	});
};

/**
 * Retrieves a member collection. Mention - UserID - Username - UserTag - MemberNickname
 * @param {collection} message The message collection.
 * @param {string} memberSearch The string to try and match for.
 * @param {boolean} bot The current bot instance.
 * @param {boolean} returnSelf DEFAULT: FALSE | Whether or not to return the author if no values are found.
 * @return {collection} The collection of the user.
 */
module.exports.getMember = async (message, memberSearch, bot, returnSelf = false) => {
	if (message.guild) {
		return new Promise(async (resolve, reject) => {
			resolve((await message.mentions.members.first()) || (await message.guild.members.get(memberSearch)) || (await message.guild.members.find(user => user.user.username === memberSearch)) || (await message.guild.members.find(user => user.user.tag === memberSearch)) || (await message.guild.members.find(user => user.nickname === memberSearch)) || (returnSelf === true ? message.member : undefined));
		});
	} else {
		return new Promise(async (resolve, reject) => {
			resolve((await bot.users.get(memberSearch)) || (await bot.users.find(user => user.username === memberSearch)) || (await bot.users.find(user => user.tag === memberSearch)) || (returnSelf === true ? message.author : undefined));
		});
	}
};

/**
 * Retrieves a channel collection. Mention - ChannelID - ChannelName
 * @param {collection} message The message collection.
 * @param {string} channelSearch The string to try and match for.
 * @param {boolean} returnSelf DEFAULT: FALSE | Whether or not to return the current channel if no other matches are found.
 * @return {collection} Returns a channel collection.
 */
module.exports.getChannel = async (message, channelSearch, returnSelf = false) => {
	return new Promise((resolve, reject) => {
		resolve(message.mentions.channels.first() || message.guild.channels.find(chan => chan.id === channelSearch) || message.guild.channels.find(chan => chan.name === channelSearch) || (returnSelf === true ? message.channel : undefined));
	});
};

/**
 * Retrieves a role collection. Mention - RoleID - RoleName
 * @param {collection} message The message collection.
 * @param {string} roleSearch The string to try and match for.
 * @param {boolean} returnSelf DEFAULT: FALSE | Whether or not to return the current highestrole if no other matches are found.
 * @return {collection} Returns a role collection.
 */
module.exports.getRole = async (message, roleSearch, returnSelf = false) => {
	return new Promise((resolve, reject) => {
		resolve(message.mentions.roles.first() || message.guild.roles.find(role => role.id === roleSearch) || message.guild.roles.find(role => role.name === roleSearch) || (returnSelf === true ? message.member.highestRole : undefined));
	});
};

/**
 * Sends an error message about permissions.
 * @param {collection} message The message collection.
 * @param {number} permLevel The required permission level.
 * @description 0 - Disabled    |    1 - Admin    |    2 - BotOwner    |    3 - Unlinked
 */
module.exports.errPerm = async (message, permLevel) => {
	let errorMessages = [`\`Error - This command is disabled right now!\``, `\`Error - Requires Admin permission!\`\nIf you think this is an issue, please contact the owner of your server.\nTell them to run \`${prefix}m\` -> \`2\` -> \`roleRepresentable\``, `\`Error - Requires BotOwner permission!\``, `\`Error - This command requires your account to be linked to a Geometry Dash account!\``];
	message.channel.send(errorMessages[permLevel]);
	return;
};

/**
 * Sends an error message about commands.
 * @param {collection} bot The current bot instance
 * @param {collection} message The message collection.
 * @param {Array.<string>} args The arguments used.
 * @param {any} cmdhid Auto CmdUsage - Number | Manual CmdUsage - String | Manual DefaultErrMsg - null
 * @param {string} reasonforerror The reason the command failed.
 */
module.exports.errMsg = async (bot, message, args, cmdhid, reasonforerror) => {
	let cmdran = bot.commands.get(args[0].toLowerCase());
	if (!cmdhid) message.channel.send(`:exclamation: \`Error\` - ${reasonforerror}`);
	else if (!isNaN(cmdhid)) message.channel.send(`:exclamation: \`Error - ${reasonforerror}!\`\nCommand Usage: \`${prefix}${cmdran.config.command[0]} ${cmdran.config.help[cmdhid * 3]}\``);
	else message.channel.send(`:exclamation: \`Error - ${reasonforerror}!\`\nCommand Usage: \`${cmdhid}\``);
	return;
};

/**
 * Sends something to the logChannel.
 * @param {collection} logChannel The logChannel channel.
 * @param {string} message The message to send.
 */
module.exports.log = async (logChannel, message) => {
	if (logChannel !== 0) logChannel.send(message);
};

/**
 * Cleans text to add the '&#(num)(num);' stuff
 * @param {string} text The text to clean
 * @returns {string} The cleaned text!
 */
module.exports.clean = async text => {
	if (!text || typeof text != 'string') return text;
	else
		return new Promise((resolve, reject) =>
			resolve(
				text
					.replace(/&/g, '&#38;')
					.replace(/</g, '&#60;')
					.replace(/>/g, '&#62;')
					.replace(/=/g, '&#61;')
					.replace(/"/g, '&#34;')
					.replace(/'/g, '&#39;'),
			),
		);
};

/**
 * Cleans text to remove the '&#(num)(num);' stuff
 * @param {string} text The text to clean
 * @returns {string} The cleaned text!
 */
module.exports.cleanR = async text => {
	if (!text || typeof text != 'string') return text;
	else
		return new Promise((resolve, reject) =>
			resolve(
				text
					.replace(/&#38;/g, '&')
					.replace(/&#60;/g, '<')
					.replace(/&#62;/g, '>')
					.replace(/&#61;/g, '=')
					.replace(/&#34;/g, '"')
					.replace(/&#39;/g, "'"),
			),
		);
};

/**
 * Returns an array of the map
 * @param {Map} map The map to turn into an array
 * @returns {Array} The array of the map
 */
module.exports.arrayMap = async map => {
	let array = [];
	map.forEach((v, k) => {
		if (!k) return;
		array.push([k, v]);
	});
	return array;
};

/**
 * Returns a string at the desired length
 * @param {string} str The string
 * @param {number} length The desired length
 * @param {string} place The location to put the string. left,center,right. DEFAULT: left
 * @param {string} joiner The string to join text together with. DEFAULT: ' '
 * @returns {string} The string at that length
 */
module.exports.toLength = async (str, length, place = 'left', joiner = ' ') => {
	return await new Promise(async (resolve, reject) => {
		if (place === 'centre' || place === 'center') {
			var p = true;
			place = 'left';
		}
		while (str.length < length) {
			if (place === 'left') {
				str += joiner;
				if (p) place = 'right';
			} else if (place === 'right') {
				str = `${joiner}${str}`;
				if (p) place = 'left';
			}
		}
		resolve(str);
	});
};

/**
 * @returns {string} The time but formatted
 */
module.exports.timeFormatted = async () => {
	// Set Time
	let time = new Date();
	return `${time.getFullYear()}-${time.getMonth() < 9 ? `0${time.getMonth() + 1}` : time.getMonth() + 1}-${time.getDate() < 10 ? `0${time.getDate()}` : time.getDate()} ${time.getHours() < 10 ? `0${time.getHours()}` : time.getHours()}-${time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes()}-${time.getSeconds() < 10 ? `0${time.getSeconds()}` : time.getSeconds()}`;
};
