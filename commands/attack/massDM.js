// commands/massSendDirectMessage.js
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  name: "massdm",
  description:
    "Envoie un message privé à plusieurs utilisateurs avec tous les selfbots",
  usage: "<liste_ids_utilisateurs> <message>",
  async execute(args) {
    if (args.length < 2) {
      return {
        success: false,
        message: "Usage: massdm <liste_ids_utilisateurs> <message>",
      };
    }

    const userIdsStr = args[0];
    const userIds = userIdsStr.split(",").map((id) => id.trim());
    const content = args.slice(1).join(" ");

    // Délai par défaut de 5 secondes pour éviter les limitations de Discord
    const delayMs = 5000;

    const result = await selfbotHandler.massSendDirectMessage(
      userIds,
      content,
      delayMs
    );
    return result;
  },
};
