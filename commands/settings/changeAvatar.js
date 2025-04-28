// commands/setAvatar.js
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  name: "setavatar",
  description: "Définit une nouvelle photo de profil pour un selfbot",
  usage: "<id_selfbot> <url_avatar>",
  async execute(args) {
    if (args.length < 2) {
      return {
        success: false,
        message: "Usage: setavatar <id_selfbot> <url_avatar>",
      };
    }

    const id = parseInt(args[0]);
    const avatarUrl = args[1];

    const result = await selfbotHandler.setAvatar(id, avatarUrl);
    return result;
  },
};
