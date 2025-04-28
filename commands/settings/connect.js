// commands/connect.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect")
    .setDescription("Connecte un ou tous les self-bots")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de connexion")
        .setRequired(true)
        .addChoices(
          { name: "Tous", value: "all" },
          { name: "Spécifique", value: "specific" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("ID du self-bot à connecter (si mode spécifique)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const mode = interaction.options.getString("mode");

    if (mode === "all") {
      const result = await selfbotHandler.connectAll();
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${result.results.length} self-bots connectés avec succès.`
      );
    } else {
      const id = interaction.options.getInteger("id");
      if (id === null) {
        return interaction.editReply("Veuillez fournir un ID de self-bot.");
      }

      const result = await selfbotHandler.connectSelfbot(id);
      await interaction.editReply(result.message);
    }
  },
};
