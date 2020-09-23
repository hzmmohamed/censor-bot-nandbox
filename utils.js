const TextOutMessage = require("nandbox-bot-api/src/outmessages/TextOutMessage");
const { Id } = require("nandbox-bot-api/src/util/Utility");

exports.sendText = (
  api,
  text,
  chatId,
  replyToMessageId,
  chatSettings,
  toUserId
) => {
  const msg = new TextOutMessage();
  msg.chat_id = chatId;
  msg.text = text;
  msg.reference = Id();
  msg.reply_to_message_id = replyToMessageId;
  msg.to_user_id = toUserId;
  msg.chat_settings = chatSettings;
  api.send(JSON.stringify(msg));
  //Unlike what common belief suggests, the delete operator has nothing to do with directly freeing memory. Memory management is done indirectly via breaking references, see the memory management page and the delete operator page for more details.
};
