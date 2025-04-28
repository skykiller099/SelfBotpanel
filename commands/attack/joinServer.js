// commands/joinServer.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Fait rejoindre un serveur aux self-bots")
    .addStringOption((option) =>
      option
        .setName("invite")
        .setDescription("Lien d'invitation Discord")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de jonction")
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

    const inviteLink = interaction.options.getString("invite");
    const mode = interaction.options.getString("mode");
    const intervalOption = interaction.options.getInteger("interval");
    const interval = intervalOption ? intervalOption * 1000 : 30000; // Par défaut 30 secondes

    if (mode === "all") {
      await interaction.editReply(
        `Tentative de faire rejoindre tous les self-bots au serveur via ${inviteLink}...`
      );

      const result = await selfbotHandler.massJoinServer(inviteLink);
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${result.results.length} self-bots ont rejoint le serveur avec succès.`
      );
    } else {
      await interaction.editReply(
        `Début de la jonction séquentielle au serveur via ${inviteLink} (intervalle: ${
          interval / 1000
        } secondes)...`
      );

      const result = await selfbotHandler.sequentialJoinServer(
        inviteLink,
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
