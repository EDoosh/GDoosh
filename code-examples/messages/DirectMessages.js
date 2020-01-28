const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// gdRepresentable
// password
// page
// get sent messages?
// recieve('EDoosh', 'password', '3');

// gdRepresentable
// password
// messageId
// sent by user?
// showMsg('EDoosh', 'password', '47325626', true);
// deleteMsg('EDoosh', 'password', '47834303');

// gdRepresentable
// password
// gdRepresentable (User to send to)
// Subject
// Content
// send('EDoosh', 'password', 'a2go', 'Test', 'Yeast');

async function recieve(un, ps, pg, sent = false) {
	if (!pg) return console.log('reeeee');
	un = (await gdtools.idAndUn(un))[2];
	ps = xor.encrypt(ps, 37526);
	let rpOptionsGetAll = {
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJMessages20.php',
		form: {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: un,
			gjp: ps,
			page: pg.toString(),
			total: '0',
			secret: 'Wmfd2893gb7',
		},
	};
	if (sent) rpOptionsGetAll.form.getSent = '1';

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
			sentByUser: comment[13] == 1 ? true : false,
			time: comment[15].replace(/\#/g, ''),
		});
	}
	fs.writeFileSync('./code-examples/messages/messageList.txt', jf(commentArray));
}

async function showMsg(un, ps, id, sent = false) {
	un = (await gdtools.idAndUn(un))[2];
	ps = xor.encrypt(ps, 37526);
	let rpOptionsMsg = {
		method: 'POST',
		uri: 'http://www.boomlings.com/database/downloadGJMessage20.php',
		form: {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: un,
			gjp: ps,
			messageID: id,
			secret: 'Wmfd2893gb7',
		},
	};
	if (sent) rpOptionsMsg.form.isSender = '1';

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
		sentByUser: msg[13] == '1' ? true : false,
		content: xor.decrypt(msg[15], 14251),
		time: msg[17],
	};
	fs.writeFileSync('./code-examples/messages/messageContent.txt', jf(messageFormat));
}

async function deleteMsg(un, ps, id, sent = false) {
	un = (await gdtools.idAndUn(un))[2];
	ps = xor.encrypt(ps, 37526);
	// Delete the message
	let rpOptionsDel = {
		method: 'POST',
		uri: 'http://www.boomlings.com/database/deleteGJMessages20.php',
		form: {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: un,
			gjp: ps,
			messageID: id,
			secret: 'Wmfd2893gb7',
		},
	};
	if (sent) rpOptionsDel.form.isSender = '1';

	let msgDel = await rp(rpOptionsDel);
	if (msgDel == '-1') return console.log('An error occured while trying to delete messages!');
	return console.log('Deleted Message.');
}

async function send(un, ps, toUser, subject, content) {
	if (!content) return console.log('Youre missing some shit here.');
	un = (await gdtools.idAndUn(un))[2];
	toUser = (await gdtools.idAndUn(toUser))[2];
	ps = xor.encrypt(ps, 37526);
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
			subject: xor.b64to(subject + '★'),
			body: xor.encrypt(content, 14251),
			secret: 'Wmfd2893gb7',
		},
	};

	let msgReturned = await rp(rpOptionsSend);
	if (msgReturned === '-1') return console.log('error');
	console.log('Successfully sent message.');
}
