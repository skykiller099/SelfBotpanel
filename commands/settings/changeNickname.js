// commands/setNickname.js
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  name: "setnick",
  description: "Change le pseudo d'un selfbot sur un serveur spécifique",
  usage: "<id_selfbot> <id_serveur> <nouveau_pseudo>",
  async execute(args) {
    if (args.length < 3) {
      return {
        success: false,
        message: "Usage: setnick <id_selfbot> <id_serveur> <nouveau_pseudo>",
      };
    }

    const id = parseInt(args[0]);
    const serverId = args[1];
    const nickname = args.slice(2).join(" ");

    const result = await selfbotHandler.setNickname(id, serverId, nickname);
    return result;
  },
};
