const _ = require("lodash");

const COMMANDS = {
	help: {
		name: "help",
		regex: /^\/help(?!.*\/.*)/,
		example: "/help",
		desc: "Display Bot Help Message.",
	},
	add: {
		name: "add",
		regex: /^\/add\s+(W|D|R|B)\s+([\w\s]+)(?!.*\/.*)/,
		example:
			"/add_keywords:\n" +
			"format: /add [action] [keyword(s)]\n" +
			`[action] :
				W - send a warning private message to the user 
				D - delete message only
				R - remove user and delete message
				B - ban user and delete message	`,
		desc: "Configure new word(s) with an action.",
	},
	delete: {
		name: "delete",
		regex: /^\/delete\s+([\w\s]+)(?!.*\/.*)/,
		example: "/delete [keywords(s)]",
		desc: "Delete previously configured words.",
	},
	list: {
		name: "list",
		regex: /^\/list(?!.*\/.*)/,
		example: "/list",
		desc:
			"Shows a list of all previously configured words with their associated actions.",
	},
	editWarnMsg: {
		name: "edit_warn_msg",
		regex: /^\/edit_warn_msg\s+([\w\s]+)(?!.*\/.*)/,
		example: "/edit_warn_msg [new_msg]",
		desc: "Edit the message set for Warning (W) action.",
	},
	resetWarnMsg: {
		name: "reset_warn_msg",
		regex: /^\/reset_warn_msg(?!.*\/.*)/,
		example: "/reset_warn_msg",
		desc: "Reset the message set for Warning (W) action to default.",
	},
};
exports.CMDs = _.mapValues(COMMANDS, (cmd) => cmd.name);

exports.parseCommand = (text) => {
	const cmdMatches = [];
	new Map(
		Object.entries(
			_.mapValues(COMMANDS, ({ name, regex }) => {
				return { name, regex };
			})
		)
	).forEach((cmd, cmdType) => {
		console.log(cmd);
		const matchArray = text.match(cmd.regex);
		let cmdParams = {};
		if (matchArray) {
			switch (cmd.name) {
				case COMMANDS.add.name:
					console.log("add entered");
					cmdParams = {
						action: matchArray[1],
						keywords: matchArray[2]
							.replace(/-|_|/, "")
							.toLowerCase()
							.split(/\s+/),
					};
					break;
				case COMMANDS.delete.name:
					cmdParams = {
						keywords: matchArray[1]
							.replace(/-|_|/, "")
							.toLowerCase()
							.split(/\s+/),
					};
					console.log;
					break;
				case COMMANDS.editWarnMsg.name:
					cmdParams = {
						newMsg: matchArray[1],
					};
					break;
			}
			cmdMatches.push({
				cmdName: cmd.name,
				cmdParams,
			});
		}
	});
	if (cmdMatches.length > 0) return cmdMatches[0];
	else return { cmdType: null, cmdParams: {} };
};

exports.list = (db, groupId) => {
	return db.getGroupWords(groupId);
};

exports.addWords = (db, groupId, params) =>
	new Promise((resolve, reject) => {
		db.addWords(params.keywords, groupId, params.action)
			.then(() => {
				console.log(
					`[${params.keywords.join(
						", "
					)} ] configured successfully with action ${
						params.action
					} for group with Id(${groupId})`
				);
				resolve({ words: params.keywords, action: params.action });
			})
			.catch((err) => {
				console.log(
					`[${params.keywords.join(
						", "
					)}] configuration unsuccessful for group with Id(${groupId})`
				);
				reject(err);
			});
	});

exports.getHelpMsg = () => {
	let helpMsg =
		"Censor Bot v0.1\n" + "Commands:\n--------------------------------\n";
	new Map(
		Object.entries(
			_.mapValues(COMMANDS, (cmd) => _.pick(cmd, ["example", "desc"]))
		)
	).forEach((cmd) => {
		console.log(cmd);
		helpMsg = helpMsg.concat([
			`${cmd.example}\n`,
			`${cmd.desc}\n--------------------------------\n`,
		]);
		console.log(helpMsg);
	});
	return helpMsg;
};

//todo: check that the words are in the db
exports.deleteWords = (db, groupId, params) =>
	new Promise((resolve, reject) => {
		params.keywords.forEach((word) => {
			db.deleteWord(word, groupId)
				.then(() => {
					console.log(
						`[${word}] deleted successfully for group with Id(${groupId})`
					);
					resolve(word);
				})
				.catch((err) => {
					console.log(
						`Deleting [${word}] unsuccessful for group with Id(${groupId})`
					);
					reject(err);
				});
		});
	});

exports.editWarnMsg = (db, groupId, params) => {
	return new Promise((resolve, reject) => {
		db.updateWarningMsg(groupId, params.newMsg)
			.then(() => {
				console.log(
					`Warning Message for group ${groupId} successfully updated to "${params.newMsg}"`
				);
				resolve();
			})
			.catch((err) => {
				console.log(
					`Updating warning Message for group ${groupId} unsuccessful"`
				);
				reject(err);
			});
	});
};
