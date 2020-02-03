const Discord = require('discord.js');
const db = require('quick.db');
const rp = require('request-promise');
const tools = require('./generalFunctions.js');
const gdTools = require('./gdFunctions.js');
const XOR = require('./XOR.js');
const xor = new XOR();

module.exports.run = async bot => {
	// Retrieve all messages the account has from the GD servers
	let rpOptionsGetAll = { method: 'POST', uri: 'http://www.boomlings.com/database/getGJMessages20.php', form: { gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: '0', accountID: loginData.accountId, gjp: loginData.password, page: '0', total: '0', secret: regData.secret } };
	let returned = await rp(rpOptionsGetAll).catch(() => {
		return undefined;
	});
	// If there is an error, return error. If there are no messages, exit the function.
	if (!returned) return console.log(cErrInfo(`Issue retrieving messages. GD Servers likely experiencing issues.`));
	if (returned === '-1') return console.log(cErrMsg('Retrieving messages returned -1 error message.'));
	if (returned === '-2') return /*console.log('No messages.')*/;
	// Split all the returned messages at the vertical line. This is what seperates each individual message.
	let comments = returned.split('|');

	// For each message...
	for (i = 0; i < comments.length; i++) {
		// Split at the semicolon.
		let comment = comments[i].split(':');
		// Request the message with its messageID
		let rpOptionsMsg = { method: 'POST', uri: 'http://www.boomlings.com/database/downloadGJMessage20.php', form: { gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: '0', accountID: loginData.accountId, gjp: loginData.password, messageID: comment[7], secret: regData.secret } };
		let msgReturned = await rp(rpOptionsMsg).catch(() => console.log(cErrInfo(`Issue retrieving individual message. GD Servers likely experiencing issues.`)));
		// If there was an error retrieving the message, complain.
		if (msgReturned === '-1') return console.log(cErrMsg('Retrieving individual message returned -1 error message.'));

		// Split the returned message data by the semicolon, then call XOR to decrypt the message.
		let msg = msgReturned.split(':');
		let content = xor.decrypt(msg[15], 14251);
		let playerId = msg[3];

		// Check if it matches something in the Set we made in link.js
		if (linkAccMap.has(content)) {
			let lamg = linkAccMap.get(content);
			// Check if GD player already in DB
			if (playersByPID.has(playerId)) {
				let oldDbPlayers = playersByUID.get(lamg);
				playersByUID.delete(oldDbPlayers);
				playersByPID.delete(playerId);
				let map = await tools.arrayMap(playersByPID);
				if (!map || !map.length || map.length < 1) map = [[]];
				await db.set(`players`, map);
				console.log(`LinkAccount 46 ${await db.get(`players`)}`);
			}
			// Check if discord already in DB
			if (playersByUID.has(lamg)) {
				let oldDbPlayers = playersByPID.get(playerId);
				playersByUID.delete(lamg);
				playersByPID.delete(oldDbPlayers);
				let map = await tools.arrayMap(playersByPID);
				if (!map || !map.length || map.length < 1) map = [[]];
				await db.set(`players`, map);
				console.log(`LinkAccount 54 ${await db.get(`players`)}`);
			}
			let user = await bot.users.find(x => x.id === lamg);
			try {
				db.push(`players`, [playerId, lamg]);
				playersByPID.set(playerId, lamg);
				playersByUID.set(lamg, playerId);
				user.send(`Successfully linked your account with **${msg[1]}**!\nIf you want to set yourself a custom profile description, use \`${config.prefix}me [your personal description]\` in the server you linked the bot in.`).catch(() => {});
			} catch (err) {
				console.log(cErrInfo(`There was an issue linking a player's account.\nIf you think this is because there are no players in the database and the TypeError is 'Target is not an array.', please fix this by DMing EDoosh#9599 json.sqlite.\nThe following is the full error message.\n`) + cErrMsg(err));
				user.send(`There was an issue linking your account`);
			}
			linkAccMap.delete(content);
		}

		// Request the servers to politely delete the message, and then throw a trantrum to you if it doesn't work.
		let rpOptionsDel = { method: 'POST', uri: 'http://www.boomlings.com/database/deleteGJMessages20.php', form: { gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: '0', accountID: loginData.accountId, gjp: loginData.password, messageID: comment[7], secret: regData.secret } };
		let msgDel = await rp(rpOptionsDel).catch(() => console.log(cErrInfo(`Issue deleting message. GD Servers likely experiencing issues.`)));
		if (msgDel === '-1') return console.log(cErrMsg('An error occured while trying to delete a message.'));
	}
};
