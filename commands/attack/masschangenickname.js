// commands/massSetNickname.js
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  name: "massnick",
  description:
    "Change le pseudo de tous les selfbots sur un serveur spécifique",
  usage: "<id_serveur> <nouveau_pseudo>",
  async execute(args) {
    if (args.length < 2) {
      return {
        success: false,
        message: "Usage: massnick <id_serveur> <nouveau_pseudo>",
      };
    }

    const serverId = args[0];
    const nickname = args.slice(1).join(" ");

    const result = await selfbotHandler.massSetNickname(serverId, nickname);
    return result;
  },
};
