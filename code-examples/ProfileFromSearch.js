const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));

const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//            ******** **********   *******   **       ******** ****     **             //
//           **////// /////**///   **/////** /**      /**///// /**/**   /**             //
//          /**           /**     **     //**/**      /**      /**//**  /**             //
//          /*********    /**    /**      /**/**      /******* /** //** /**             //
//          ////////**    /**    /**      /**/**      /**////  /**  //**/**             //
//                 /**    /**    //**     ** /**      /**      /**   //****             //
//           ********     /**     //*******  /********/********/**    //***             //
//          ////////      //       ///////   //////// //////// //      ///              //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// Thanks Colon
// https://github.com/GDColon/GDBrowser/blob/master/api/profile.js

ProfileFromAcc('KelleyXP');

async function ProfileFromAcc(search) {
	// The following is just to get the account ID from a string. Does this even if search term is an ID
	// Create the first object to pass through to the first request
	const rpoInitial = {
		method: 'POST',
		uri: 'http://boomlings.com/database/getGJUsers20.php',
		form: {
			str: search,
			secret: regData.secret,
		},
	};
	// Retrieve basic info, format it, and then get the account ID from it.
	const returnedInitial = await rp(rpoInitial);
	let accountId = (await gdtools.parseResponse(returnedInitial))[16];
	console.log(await gdtools.parseResponse(returnedInitial));

	// The following retrieves information about the user from the accountId we got before.
	// Create the object to pass through to request-promise
	const rpoInformation = {
		method: 'POST',
		uri: 'http://boomlings.com/database/getGJUserInfo20.php',
		form: {
			targetAccountID: accountId,
			secret: regData.secret,
		},
	};
	// Retrieve and array-ify the user's information.
	const returned = await rp(rpoInformation);
	let account = await gdtools.parseResponse(returned);
	// Turn their data into an object
	let userData = {
		username: account[1],
		playerID: account[2],
		accountID: account[16],
		rank: account[30],
		stars: account[3],
		diamonds: account[46] == '65535' ? '65535+' : account[46],
		coins: account[13],
		userCoins: account[17],
		demons: account[4],
		cp: account[8],
		friendRequests: account[19] == '0',
		messages: account[18] == '0' ? 'all' : account[18] == '1' ? 'friends' : 'off',
		commentHistory: account[50] == '0' ? 'all' : account[50] == '1' ? 'friends' : 'off',
		moderator: account[49],
		youtube: account[20] || null,
		twitter: account[44] || null,
		twitch: account[45] || null,
		icon: account[21],
		ship: account[22],
		ball: account[23],
		ufo: account[24],
		wave: account[25],
		robot: account[26],
		spider: account[43],
		col1: account[10],
		col2: account[11],
		deathEffect: account[48],
		glow: account[28] == '1',
	};
	console.log(userData);
}

// '1': 'ViPriN',    Username
// '2': '1078150',   PlayerID
// '3': '11645',     ???  Stars at last leaderboard update
// '4': '263',       ???
// '6': '',          ???  Always blank it seems
// '8': '275',       CP
// '9': '35',        Icon
// '10': '11',       Colour1
// '11': '13',       Colour2
// '13': '149',      Coins
// '14': '1',        Messages
// '15': '2',        CommentHistory
// '16': '2795',     AccountID
// '17': '1783'      ???
