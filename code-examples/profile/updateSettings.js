const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// allowMessagesFrom (0 - All | 1 - Friends | 2 - None)
// friendRequestsFrom (0 - All | 1 - None)
// showCommentHistoryTo (0 - All | 1 - Friends | 2 - User only)
// youtube
// twitter
// twitch

// GDRepresentable - Password - Settings JSON (See above for paramaters)
updateSettings('EDoosh', 'password');

async function updateSettings(un, ps, settings = {}) {
	if (!ps) return console.log('reeeee');
	un = await gdtools.profile(un);
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

	console.log(form);
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/updateGJAccSettings20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log(resp);
	console.log('Updated settings!');
}
