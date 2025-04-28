// commands/info.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Affiche les informations sur les self-bots")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode d'affichage")
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

    const mode = interaction.options.getString("mode");

    if (mode === "all") {
      const result = selfbotHandler.getAllSelfbotsInfo();

      if (!result.success) {
        return interaction.editReply(
          "Erreur lors de la récupération des informations."
        );
      }

      if (result.data.length === 0) {
        return interaction.editReply("Aucun self-bot configuré.");
      }

      const embed = new EmbedBuilder()
        .setTitle("Informations sur tous les Self-bots")
        .setColor("#0099ff")
        .setDescription(`Total de ${result.data.length} self-bots configurés`)
        .setTimestamp();

      result.data.forEach((bot) => {
        embed.addFields({
          name: `Self-bot #${bot.id}`,
          value:
            `État: ${bot.connected ? "✅ Connecté" : "❌ Déconnecté"}\n` +
            `${bot.username ? `Nom: ${bot.username}\n` : ""}` +
            `${bot.userId ? `ID: ${bot.userId}\n` : ""}` +
            `${bot.connected ? `Serveurs: ${bot.guilds}\n` : ""}` +
            `${bot.connected ? `Statut: ${bot.status}\n` : ""}`,
        });
      });

      return interaction.editReply({ embeds: [embed] });
    } else {
      const id = interaction.options.getInteger("id");
      if (id === null) {
        return interaction.editReply("Veuillez fournir un ID de self-bot.");
      }

      const result = selfbotHandler.getSelfbotInfo(id);

      if (!result.success) {
        return interaction.editReply(result.message);
      }

      const bot = result.data;
      const embed = new EmbedBuilder()
        .setTitle(`Informations sur le Self-bot #${bot.id}`)
        .setColor(bot.connected ? "#00ff00" : "#ff0000")
        .setDescription(bot.connected ? "✅ Connecté" : "❌ Déconnecté")
        .setTimestamp();

      if (bot.connected) {
        embed.addFields(
          {
            name: "Nom d'utilisateur",
            value: bot.username || "Non disponible",
            inline: true,
          },
          {
            name: "ID Utilisateur",
            value: bot.userId || "Non disponible",
            inline: true,
          },
          {
            name: "Nombre de serveurs",
            value: bot.guilds.toString(),
            inline: true,
          },
          { name: "Statut", value: bot.status, inline: true }
        );
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
