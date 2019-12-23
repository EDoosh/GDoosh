const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const config = JSON.parse(fs.readFileSync('../config.json'));

const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};

endMyLife();

async function endMyLife() {
	const loginData = JSON.parse(fs.readFileSync('../login.txt'));

	let rpOptionsGetAll = {
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJMessages20.php',
		form: {
			gameVersion: regData.gameVersion,
			binaryVersion: regData.binaryVersion,
			gdw: '0',
			accountID: loginData.accountId,
			gjp: loginData.password,
			page: '0',
			total: '0',
			secret: regData.secret,
		},
	};

	let returned = await rp(rpOptionsGetAll);
	if (returned === '-1') return console.log('error');
	if (returned === '-2') return console.log('No messages.');

	let comments = returned.split('|');
	let commentArray = [];

	for (i = 0; i < comments.length; i++) {
		let comment = comments[i].split(':');
		commentArray.push({
			username: comment[1],
			playerId: comment[3],
			accountId: comment[5],
			messageId: comment[7],
			title: xor.b64from(comment[9]),
			8: comment[11],
			9: comment[13],
			time: comment[15],
		});
	}

	var msgArray = [];
	for (i = 0; i < comments.length; i++) {
		let rpOptionsMsg = {
			method: 'POST',
			uri: 'http://www.boomlings.com/database/downloadGJMessage20.php',
			form: {
				gameVersion: regData.gameVersion,
				binaryVersion: regData.binaryVersion,
				gdw: '0',
				accountID: loginData.accountId,
				gjp: loginData.password,
				messageID: commentArray[i].messageId,
				secret: regData.secret,
			},
		};
		let msgReturned = await rp(rpOptionsMsg);
		if (msgReturned === '-1') return console.log('error');

		let msg = msgReturned.split(':');
		let messageFormat = {
			username: msg[1],
			playerId: msg[3],
			accountId: msg[5],
			messageId: msg[7],
			title: xor.b64from(msg[9]),
			8: msg[11],
			9: msg[13],
			content: xor.decrypt(msg[15], 14251),
			time: msg[17],
		};
		msgArray.push(messageFormat);
	}

	// Delete the message
	for (i = 0; i < msgArray.length; i++) {
		let rpOptionsDel = {
			method: 'POST',
			uri: 'http://www.boomlings.com/database/deleteGJMessages20.php',
			form: {
				gameVersion: regData.gameVersion,
				binaryVersion: regData.binaryVersion,
				gdw: '0',
				accountID: loginData.accountId,
				gjp: loginData.password,
				messageID: msgArray[i].messageId,
				secret: regData.secret,
			},
		};
		let msgDel = await rp(rpOptionsDel);
		if (msgDel === '-1') return console.log('An error occured while trying to delete messages!');
	}
}
