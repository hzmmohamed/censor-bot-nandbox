"use strict";
const NandBox = require("nandbox-bot-api/src/NandBox");
const Nand = require("nandbox-bot-api/src/NandBoxClient");
const NandBoxClient = Nand.NandBoxClient;
const Utils = require("nandbox-bot-api/src/util/Utility");
const Id = Utils.Id;

const TOKEN = "90091784233441376:0:INmPMWi6ElkejHSlxzSV8AHuPffvPJ";
const config = {
	URI: "wss://d1.nandbox.net:5020/nandbox/api/",
	DownloadServer: "https://d1.nandbox.net:5020/nandbox/download/",
	UploadServer: "https://d1.nandbox.net:5020/nandbox/upload/",
};

var client = NandBoxClient.get(config);
var nandbox = new NandBox();
var nCallBack = nandbox.Callback;

const commands = require("./commands");
const actions = require("./actions");
const utils = require("./utils");
const db = require("./db");
const DEFAULT_WARNING_MESSAGE = `This is the default warning Message`;
let bot = null;

const handleMsg = (text, db, groupId, reply_to_message_id) => {
	const cmd = commands.parseCommand(text);
	console.log(cmd);
	switch (cmd.cmdName) {
		case commands.CMDs.add:
			console.log(cmd.cmdParams);
			commands.addWords(db, groupId, cmd.cmdParams).then((params) => {
				utils.sendText(
					api,
					`Successfully configured the action (${
						params.action
					}) for the following terms: [${params.words.join(", ")}]`,
					groupId,
					reply_to_message_id
				);
			});
			break;
		case commands.CMDs.list:
			commands.list(db, groupId).then((words) => {
				console.log(words.B);
				const reply =
					"Configured words for this Group:\n" +
					`total: ${new Array().concat(words.values).length}\n`.concat(
						Object.keys(words).map((action) => {
							if (words[action].length == 0) return "";
							else return `${action} ${words[action].join(" ")}\n`;
						})
					);
				utils.sendText(api, reply, groupId, reply_to_message_id);
			});
			break;
		case commands.CMDs.help:
			utils.sendText(api, commands.getHelpMsg(), groupId, reply_to_message_id);
			break;
		case commands.CMDs.delete:
			commands
				.deleteWords(db, groupId, cmd.cmdParams)
				.then((word) => {
					utils.sendText(
						api,
						`Successfully deleted the word '${word}' from configuration.`,
						groupId,
						reply_to_message_id
					);
				})
				.catch(() => {
					utils.sendText(
						api,
						`Successfully deleted the word '${word}' from configuration.`,
						groupId,
						reply_to_message_id
					);
				});
			break;
		case commands.CMDs.editWarnMsg:
			console.log(cmd.cmdParams);
			commands.editWarnMsg(db, groupId, cmd.cmdParams).then(() => {
				utils.sendText(
					api,
					`Successfully updated warning message to '${cmd.cmdParams.newMsg}'`,
					groupId,
					reply_to_message_id
				);
			});
			break;
		case commands.CMDs.resetWarnMsg:
			commands
				.editWarnMsg(db, groupId, { newMsg: DEFAULT_WARNING_MESSAGE })
				.then(() => {
					utils.sendText(
						api,
						`Successfully reset warning message to default '${DEFAULT_WARNING_MESSAGE}'`,
						groupId,
						reply_to_message_id
					);
				});
			break;
		default:
			utils.sendText(api, "Invalid Command", groupId, reply_to_message_id);
	}
};

let DB = null;
new db().initDB("./words.db").then((_DB) => (DB = _DB));

var api = null;
nCallBack.onConnect = (_api, { name, ID }) => {
	bot = { name, id: ID };
	api = _api;
	console.log("Authenticated");
};

nCallBack.onReceive = (incomingMsg) => {
	console.log("Message Received");
	if (incomingMsg.isTextMsg()) {
		const {
			text,
			chat,
			from,
			message_id,
			reply_to_message_id,
			reference,
			status,
		} = incomingMsg;
		if (incomingMsg.chat_settings) {
			text.split("\n").forEach((line) => {
				handleMsg(line, DB, chat.id, reply_to_message_id);
			});
		} else if (status !== "deleted") {
			console.log(text);
			console.log("not configuraiton");
			const textLowercase = text.replace(/-|_/, "").toLowerCase();
			console.log(text);
			DB.getGroupWords(chat.id).then(({ B, R, D, W }) => {
				console.log(B);
				console.log(R);
				console.log(D);
				console.log(W);
				if (new RegExp(B.join("|")).test(textLowercase) && B.length !== 0) {
					actions.banUser(api, from.id, chat.id);
				} else if (
					new RegExp(R.join("|")).test(textLowercase) &&
					R.length !== 0
				) {
					actions.removeUser(api, from.id, chat.id);
				} else if (
					new RegExp(D.join("|")).test(textLowercase) &&
					D.length !== 0
				) {
					actions.deleteMessage(api, from.id, chat.id, message_id, reference);
				} else if (
					new RegExp(W.join("|")).test(textLowercase) &&
					W.length !== 0
				) {
					DB.getWarningMsg(chat.id).then((warningMsg) => {
						actions.warnUser(api, chat.id, from.id, message_id, warningMsg);
					});
				}
			});
		}
	}
};

// implement other nandbox.Callback() as per your bot need
nCallBack.onReceiveObj = (obj) => console.log("received object: ", obj);
nCallBack.onClose = () => console.log("ONCLOSE");
nCallBack.onError = () => console.log("ONERROR");
nCallBack.onChatMenuCallBack = (chatMenuCallback) => {};
nCallBack.onInlineMessageCallback = (inlineMsgCallback) => {};
nCallBack.onMessagAckCallback = (msgAck) => {};
nCallBack.onUserJoinedBot = (user) => {};
nCallBack.onChatMember = ({ user, chat, type, status }) => {
	if (user.id === bot.id && type === "Admin" && status === "Active") {
		//TODO update default warning message
		DB.addGroup(chat.id, DEFAULT_WARNING_MESSAGE)
			.then(() => {
				console.log(`Group with Id ${chat.id} successfully added to DB`);
			})
			.catch((err) => {
				console.log(err.message);
				console.log(`Group with Id ${chat.id} already in DB`);
			});
	} else if (user.id === bot.id && status === "Removed") {
		DB.deleteGroup(chat.id).then(() => {
			console.log(`Group with Id ${chat.id} successfully deleted from DB`);
		});
	}
	// else if( statu)
};
nCallBack.onChatAdministrators = (chatAdministrators) => {};
nCallBack.userStartedBot = (user) => {};
nCallBack.onMyProfile = (user) => {};
nCallBack.onUserDetails = (user) => {};
nCallBack.userStoppedBot = (user) => {};
nCallBack.userLeftBot = (user) => {};
nCallBack.permanentUrl = (permenantUrl) => {};
nCallBack.onChatDetails = (chat) => {};
nCallBack.onInlineSearh = (inlineSearch) => {};

client.connect(TOKEN, nCallBack);
