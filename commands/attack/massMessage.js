// commands/sendMessage.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send")
    .setDescription("Fait envoyer un message aux self-bots")
    .addStringOption((option) =>
      option
        .setName("serverid")
        .setDescription("ID du serveur")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("channelid")
        .setDescription("ID du canal")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message à envoyer")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode d'envoi")
        .setRequired(true)
        .addChoices(
          { name: "Tous en même temps", value: "all" },
          { name: "Un par un (intervalle)", value: "sequential" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("interval")
        .setDescription("Intervalle en secondes (pour le mode séquentiel)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(300)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const serverId = interaction.options.getString("serverid");
    const channelId = interaction.options.getString("channelid");
    const content = interaction.options.getString("message");
    const mode = interaction.options.getString("mode");
    const intervalOption = interaction.options.getInteger("interval");
    const interval = intervalOption ? intervalOption * 1000 : 30000; // Par défaut 30 secondes

    if (mode === "all") {
      await interaction.editReply(
        `Tentative d'envoi de message avec tous les self-bots...`
      );

      const result = await selfbotHandler.massSendMessage(
        serverId,
        channelId,
        content
      );
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${result.results.length} self-bots ont envoyé le message avec succès.`
      );
    } else {
      await interaction.editReply(
        `Début de l'envoi séquentiel de messages (intervalle: ${
          interval / 1000
        } secondes)...`
      );

      const result = await selfbotHandler.sequentialSendMessage(
        serverId,
        channelId,
        content,
        interval
      );
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `Opération terminée!\n` +
          `Total: ${result.results.length} self-bots\n` +
          `✅ Réussis: ${successCount}\n` +
          `❌ Échoués: ${result.results.length - successCount}`
      );
    }
  },
};
