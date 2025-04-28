// commands/addselfbot.js
const { SlashCommandBuilder } = require("discord.js");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addselfbot")
    .setDescription("Ajoute un nouveau self-bot en fournissant son token.")
    .addStringOption((option) =>
      option
        .setName("token")
        .setDescription("Le token du self-bot à ajouter.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const token = interaction.options.getString("token");
    const result = await selfbotHandler.addSelfbot(token);
    await interaction.reply({ content: result.message, ephemeral: true });
  },
};
