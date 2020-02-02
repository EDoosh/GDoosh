const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const XOR = require('../functions/XOR.js');
const xor = new XOR();

module.exports.run = async (bot, message, args) => {
	if (!playersByUID.has(message.author.id)) return message.channel.send(`This Discord account is currently not connected to a Geometry Dash account.`);
	let profile = await gdtools.idAndUn(await playersByUID.get(message.author.id));

	let m = await message.author.send(`Please type the password of your account.\n> Please note that this system is not fully secure. By continuing, you agree that ${config.name} nor it's owners are responsible for anything that may happen as a result of you linking your password to your account.`);
	const filterQM = fMsg => fMsg.author.id === message.author.id;
	var msgQ = await m.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
	msgQ.on('collect', async respQ => {
		un = profile[2];
		toUser = loginData.accountId;
		ps = xor.encrypt(respQ.content, 37526);
		let rpOptionsSend = {
			method: 'POST',
			uri: 'http://www.boomlings.com/database/uploadGJMessage20.php',
			form: {
				gameVersion: '21',
				binaryVersion: '35',
				gdw: '0',
				accountID: un,
				gjp: ps,
				toAccountID: toUser,
				subject: xor.b64to('Password Authentication'),
				body: xor.encrypt(`Password Authentication for ${config.name}.`, 14251),
				secret: 'Wmfd2893gb7',
			},
		};
		let msgReturned = await rp(rpOptionsSend);
		if (msgReturned === '-1') return message.author.send(`Failed to authorize password.`);
		db.push(`passwords`, [message.author.id, respQ.content]);
		passwords.set(message.author.id, respQ.content);
		message.author.send(`Authorized password! You can now use password-required features!\n> Please delete the password you have provided above. It is no longer required, and could cause issues if somehow leaked.`);
	});
};

module.exports.config = {
	command: ['password', 'ps', 'pw', 'pass'],
	permlvl: 'All',
	help: ['Other', 'Link up your account with a password to use extended GDoosh features.', 'All', '[accountPassword]', 'Link up your account with a password to use extended GDoosh features.'],
	helpg: 'generalCommandSyntax',
};
