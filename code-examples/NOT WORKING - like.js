const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const crypto = require('crypto');
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));

//
//
//  WHILE IT MAY SEEM IT IS WORKING, IT DOESNT. I DO NOT KNOW WHY.
//
//

// playerRepresentable
// password
// levelID  : commentID : postID
// level    : comment   : post
// like     : dislike
// 0        : levelID   : playerRepresentable
like('EDoosh', 'password', '59177988', 'level', 'like', '0');

async function like(un, ps, id, type, like, special) {
	if (!id || !type || !like || !un || !ps || !special) return console.log("You're missing a field.");
	let pi = await gdtools.idAndUn(un);
	special = type === 'level' ? '0' : type === 'post' ? (await gdtools.idAndUn(special))[2] : special;
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: pi[2].toString(),
		gjp: xor.encrypt(ps, 37526),
		udid: 'ffffffff-c331-1ad3-5db0-483a7fdae3af',
		uuid: pi[1].toString(),
		itemID: id.toString(),
		like: like == 'dislike' ? '0' : '1',
		type: type === 'post' ? '3' : type === 'comment' ? '2' : '1',
		secret: 'Wmfd2893gb7',
		special: special.toString(),
		rs: '8f0l0ClAN1',
	};

	let chk = form.special + form.itemID + form.like + form.type + form.rs + form.accountID + form.udid + form.uuid + 'ysg6pUrtjn0J';
	chk = await gdtools.sha1(chk);
	chk = xor.encrypt(chk, 58281);
	form.chk = chk;

	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/likeGJItem211.php',
		form: form,
	});
	if (!resp) return console.log("The Geometry Dash servers returned an error! Perhaps they're down for maintenance");
	if (resp == '-1') return console.log('The Geometry Dash servers rejected your vote! Make sure your username and password are entered correctly.');
	console.log(resp);
	console.log(`Successfully ${like == 'dislike' ? 'Disliked' : 'Liked'}!`);
}
