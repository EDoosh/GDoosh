const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

commentHistory('viprin', 'recent');

async function commentHistory(un, m = 'liked', pg = 0, cnt = 5) {
	// This gets the username, playerID, and accountID from either the username or playerID
	un = await gdtools.idAndUn(un);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		secret: 'Wmfd2893gb7',
		page: pg.toString(), // Robs servers like strings more than numbers
		mode: m === 'liked' ? 1 : 0, // If searching by liked, set this to 1. If searching by recent, set this to 0
		userID: un[1], // From the retrieved user data before, get the playerID
		count: parseInt(cnt), // The amount to display on each page
	};
	let resp = await rp({
		// Request the comment history
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJCommentHistory.php',
		form: form,
	}).catch(() => {
		return undefined;
	}); // If there was an error, catch it and set resp to undefined instead
	if (!resp || resp == '-1') return console.log('error'); // If resp is undefined or servers returned nothing (-1 in robtop speak), return error

	// Returned data is a bit messy
	let respSplit = resp.split(/\#/g)[0].split(/\|/g); // Split at the # sign, then get the stuff before it and split that at every |
	if (!respSplit || !respSplit[0]) return console.log('error 2'); // If there is nothing, return error

	// PlayerData is located in every comment info. Use the first one, then we parse it so that it will turn
	// 1~ViPriN~9~42~10~11~11~13~14~1~15~2~16~2795
	// into an object which looks like
	// { 1: "ViPriN", 9: 42, 10: 11, 11: 13, 14: 1, 15: 2, 16: 2795 }
	let playerData = await gdtools.parseResponse(respSplit[0].split(/\:/g)[1], '~');
	// Create the comments array and set player info as the first item
	comments = [
		{
			username: playerData[1],
			accountId: playerData[16],
			icon: parseInt(playerData[9]),
			form: parseInt(playerData[14]),
			col1: parseInt(playerData[10]),
			col2: parseInt(playerData[11]),
		},
	];

	if (pg == 0) {
		// Check if its on the first page
		let respInfo = resp.split(/\#/g)[1].split(/\:/g);
		comments.push({
			totalComments: parseInt(respInfo[0]),
			lowestCommentNumber: parseInt(respInfo[1]),
			perPage: parseInt(respInfo[2]),
			page: Math.ceil(parseInt(respInfo[1]) / parseInt(respInfo[2])) + 1,
			sortedBy: m === 'liked' ? 'like' : 'recent',
		});
	}
	let levels = {}; // This will allow us to determine whether they are the author of the level or not.
	// That data is not returned in the comment history. For comments to appear as yellow in CH ingame, you need to go to the level
	for (const r of respSplit) {
		// For every value in respSplit
		let x = await gdtools.parseResponse(r.split(/\:/g)[0], '~'); // This is the comment data
		let content = xor.b64from(x[2]); // Decode the content from base64
		if (!levels.hasOwnProperty(x[1].toString())) {
			// Check if the levels object has the level ID. If not...
			let lvl = await gdtools.getLevel(x[1]); // Get the level data
			if (lvl.authorID == x[3]) levels[x[1].toString()] = true;
			// If they are the author, set the property for that id to true
			else levels[x[1].toString()] = false; // If they are not the author, set the property for that id to false
		}
		// Format the content
		let y = {
			playerId: x[3],
			contents: content.replace(/[★☆⍟]/g, ''), // If anything in there is from GDoosh or GDBrowser, replace it so it doesnt appear
			likes: parseInt(x[4]),
			time: x[9],
			id: x[1],
			percent: parseInt(x[10]),
			commentId: x[6],
			// 1 for GDoosh, 2 for GDBrowser, 3 for owns level, 4 for Robtop, 5 for elder mod, 0 for loser regular GD user.
			special: content.endsWith('★') ? 1 : content.endsWith('⍟') || content.endsWith('☆') ? 2 : levels[x[1].toString()] ? 3 : x[3] == 16 ? 4 : x[12] ? 5 : 0,
		};
		// push into the comments array
		comments.push(y);
	}
	fs.writeFileSync('./code-examples/comments/commentHistory.txt', jf(comments));
}
