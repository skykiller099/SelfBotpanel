// commands/reactToMessage.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("react")
    .setDescription("Fait réagir les self-bots à un message")
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
        .setName("messageid")
        .setDescription("ID du message")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("emoji")
        .setDescription("Emoji à ajouter en réaction")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de réaction")
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
        .setMaxValue(60)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const serverId = interaction.options.getString("serverid");
    const channelId = interaction.options.getString("channelid");
    const messageId = interaction.options.getString("messageid");
    const emoji = interaction.options.getString("emoji");
    const mode = interaction.options.getString("mode");
    const intervalOption = interaction.options.getInteger("interval");
    const interval = intervalOption ? intervalOption * 1000 : 5000; // Par défaut 5 secondes

    if (mode === "all") {
      await interaction.editReply(
        `Tentative d'ajout de réactions avec tous les self-bots...`
      );

      const result = await selfbotHandler.massReactToMessage(
        serverId,
        channelId,
        messageId,
        emoji
      );
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${result.results.length} self-bots ont réagi au message avec succès.`
      );
    } else {
      await interaction.editReply(
        `Début de l'ajout séquentiel de réactions (intervalle: ${
          interval / 1000
        } secondes)...`
      );

      const results = await selfbotHandler.sequentialReactToMessage(
        serverId,
        channelId,
        messageId,
        emoji,
        interval
      );

      let detailedMessage = `Opération séquentielle terminée!\n`;
      results.results.forEach((res) => {
        detailedMessage += `Self-bot #${res.id}: ${
          res.success ? "✅ Réussi" : "❌ Échec"
        } - ${res.message}\n`;
      });

      await interaction.editReply(detailedMessage);
    }
  },
};
