const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// Username - Password
allFriends('EDoosh', 'password');

// Username - Password - TargetAccount
// removeFriend('EDoosh', 'password', 'a2go');

// Username - Password - SentByUser - Page
// friendReqs('EDoosh', 'password', false, 0);

// Username - Password - TargetAccount - FriendRequestID
// acceptRecievedFriendReq('EDoosh', 'password', 'dreamtide', '39273406');

// Username - Password - TargetAccount - SentByUser
// deleteFriendReq('EDoosh', 'password', 'a2go', true);

// Username - Password - TargetAccount - Content
// sendFriendReq('EDoosh', 'password', 'a2go', 'a');

async function allFriends(un, ps) {
	if (!ps) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		type: 0,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJUserList20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	let split = resp.split(/\#/)[0].split(/\|/);
	let format = [
		{
			total: split.length,
		},
	];
	for (i = 0; i < split.length; i++) {
		let x = await gdtools.parseResponse(split[i], ':');
		let y = {};
		y.username = x[1];
		y.playerId = x[2];
		y.accountId = x[16];
		y.icon = x[9]; // The icon of the form chosen.
		y.col1 = x[10];
		y.col2 = x[11];
		y.form = x[14];
		y[15] = x[15]; // idk
		y[18] = x[18]; // same for this
		format.push(y);
	}
	fs.writeFileSync('./code-examples/profile/allFriends.txt', jf(format));
}

async function removeFriend(un, ps, un2) {
	if (!un2) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		targetAccountID: un2[2],
		gjp: ps,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/removeGJFriend20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Removed friend!');
}

async function friendReqs(un, ps, sender = false, page = 0) {
	if (!ps) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		page: page.toString(),
		secret: 'Wmfd2893gb7',
	};
	if (sender) form.getSent = '1';
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJFriendRequests20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	let split = resp.split(/\#/)[0].split(/\|/);
	let format = [];
	if (page == 0) {
		let pgInfo = resp.split(/\#/)[1].split(/\:/);
		format.push({
			total: pgInfo[0],
			page: Math.floor(pgInfo[1] / pgInfo[2]),
			perPage: pgInfo[2],
		});
	}
	for (i = 0; i < split.length; i++) {
		let x = await gdtools.parseResponse(split[i], ':');
		let y = {};
		y.username = x[1];
		y.playerId = x[2];
		y.accountId = x[16];
		y.icon = x[9]; // The icon of the form chosen.
		y.col1 = x[10];
		y.col2 = x[11];
		y.form = x[14];
		y[15] = x[15]; // idk
		y[41] = x[41]; // and this
		y.friendRequestId = x[32];
		y.content = xor.b64from(x[35].toString());
		y.time = x[37];
		// 1 for GDoosh, 2 for GDBrowser, 0 for loser regular GD user.
		y.special = y.content.endsWith('★') ? 1 : y.content.endsWith('⍟') || y.content.endsWith('☆') ? 2 : 0;
		if (y.special !== 0) y.content = y.content.slice(0, -1);
		format.push(y);
	}
	fs.writeFileSync('./code-examples/profile/friendReqs.txt', jf(format));
}

async function acceptRecievedFriendReq(un, ps, un2, frId) {
	if (!frId) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		targetAccountID: un2[2],
		gjp: ps,
		requestID: frId,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/acceptGJFriendRequest20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Accepted friend request!');
}

async function deleteFriendReq(un, ps, un2, sender = false) {
	if (!un2) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		targetAccountID: un2[2],
		gjp: ps,
		isSender: sender ? '1' : '0',
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/deleteGJFriendRequests20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Deleted friend request!');
}

async function sendFriendReq(un, ps, un2, content) {
	if (!un2) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		toAccountID: un2[2],
		gjp: ps,
		comment: xor.b64to(content),
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/uploadFriendRequest20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Sent friend request!');
}
