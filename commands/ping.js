module.exports.run = async (bot, message, args) => {
	// Send message
	const m = await message.channel.send('Pinging...');
	m.edit(`${args[0].toLowerCase() === 'ping' ? 'Pong' : 'Ping'}! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(bot.ping)}ms`);
};

module.exports.config = {
	command: ['ping', 'pong'],
	permlvl: 'All',
	help: ['Bot', 'Get the latency and ping of the bot.', 'All', '', `Get the latency and ping of the bot.`],
};
