// commands/leaveServer.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Fait quitter un serveur aux self-bots")
    .addStringOption((option) =>
      option
        .setName("serverid")
        .setDescription("ID du serveur à quitter")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de départ")
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
    const mode = interaction.options.getString("mode");
    const intervalOption = interaction.options.getInteger("interval");
    const interval = intervalOption ? intervalOption * 1000 : 30000; // Par défaut 30 secondes

    if (mode === "all") {
      await interaction.editReply(
        `Tentative de faire quitter tous les self-bots du serveur ${serverId}...`
      );

      const result = await selfbotHandler.massLeaveServer(serverId);
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${result.results.length} self-bots ont quitté le serveur avec succès.`
      );
    } else {
      await interaction.editReply(
        `Début du départ séquentiel du serveur ${serverId} (intervalle: ${
          interval / 1000
        } secondes)...`
      );

      const result = await selfbotHandler.sequentialLeaveServer(
        serverId,
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
