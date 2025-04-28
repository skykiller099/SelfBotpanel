// commands/removeselfbot.js
const { SlashCommandBuilder } = require("discord.js");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeselfbot")
    .setDescription("Supprime un self-bot en fournissant son ID.")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("L'ID du self-bot à supprimer.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const id = interaction.options.getInteger("id");
    const result = await selfbotHandler.removeSelfbot(id);
    await interaction.reply({ content: result.message, ephemeral: true });
  },
};
