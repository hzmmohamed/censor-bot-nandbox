const BanChatMemberOutMessage = require("nandbox-bot-api/src/outmessages/BanChatMemberOutMessage");
const RecallOutMessage = require("nandbox-bot-api/src/outmessages/RecallOutMessage");
const RemoveChatMemberOutMessage = require("nandbox-bot-api/src/outmessages/RemoveChatMemberOutMessage");

const utils = require("./utils");

exports.actionsNames = {
  W: "Warn User",
  D: "Delete Msg",
  R: "Remove User + Delete Msg",
  B: "Ban User + Delete Msg",
};

//warnUser
exports.warnUser = (api, groupId, userId, messageId, warningMsg) => {
  console.log(`Attempting to warn user ${userId} from group ${groupId}`);
  utils.sendText(api, warningMsg, groupId, messageId, 0, userId);
};

//banUser
exports.banUser = (api, userId, groupId) => {
  console.log(`Attempting to ban user ${userId} from group ${groupId}`);
  const msg = new BanChatMemberOutMessage();
  msg.chat_id = groupId;
  msg.user_id = userId;
  api.send(JSON.stringify(msg.toJsonObject()));
};
//removeUser
exports.removeUser = (api, userId, groupId) => {
  console.log(`Attempting to remove user ${userId} from group ${groupId}`);
  const msg = new RemoveChatMemberOutMessage();
  msg.chat_id = groupId;
  msg.user_id = userId;
  api.send(JSON.stringify(msg.toJsonObject()));
};
//deleteMessage
exports.deleteMessage = (api, userId, groupId, messageId, reference) => {
  console.log(
    `Attempting to delete message ${messageId} by user ${userId} from group ${groupId}`
  );
  const msg = new RecallOutMessage();
  msg.chat_id = groupId;
  msg.reference = reference;
  msg.from_user_id = userId;
  msg.message_id = messageId;
  api.send(JSON.stringify(msg.toJsonObject()));
};
