// commands/changeStatus.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Change le statut des self-bots")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Statut à définir")
        .setRequired(true)
        .addChoices(
          { name: "En ligne", value: "online" },
          { name: "Inactif", value: "idle" },
          { name: "Ne pas déranger", value: "dnd" },
          { name: "Invisible", value: "invisible" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type d'activité")
        .setRequired(false)
        .addChoices(
          { name: "Joue à", value: "PLAYING" },
          { name: "Regarde", value: "WATCHING" },
          { name: "Écoute", value: "LISTENING" },
          { name: "Streame", value: "STREAMING" },
          { name: "Participe à", value: "COMPETING" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Nom de l'activité")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de changement")
        .setRequired(true)
        .addChoices(
          { name: "Tous", value: "all" },
          { name: "Spécifique", value: "specific" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("ID du self-bot (si mode spécifique)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const status = interaction.options.getString("status");
    const activityType = interaction.options.getString("type");
    const activityName = interaction.options.getString("name");
    const mode = interaction.options.getString("mode");
    const id = interaction.options.getInteger("id");

    if (mode === "all") {
      await interaction.editReply(
        `Changement du statut de tous les self-bots...`
      );

      const result = await selfbotHandler.massChangeStatus(
        status,
        activityType,
        activityName
      );
      const successCount = result.results.filter((r) => r.success).length;

      await interaction.editReply(
        `Statut modifié avec succès pour ${successCount}/${result.results.length} self-bots.`
      );
    } else {
      if (id === null) {
        return interaction.editReply("Veuillez fournir un ID de self-bot.");
      }

      const result = await selfbotHandler.changeStatus(
        id,
        status,
        activityType,
        activityName
      );
      await interaction.editReply(result.message);
    }
  },
};
