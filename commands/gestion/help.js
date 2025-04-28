// commands/help.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste de toutes les commandes disponibles."),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const commandsPerPage = 7;
    const allCommands = interaction.client.commands;
    const totalPages = Math.ceil(allCommands.size / commandsPerPage);
    let currentPage = 1;

    const generateEmbed = (page) => {
      const startIndex = (page - 1) * commandsPerPage;
      const endIndex = Math.min(startIndex + commandsPerPage, allCommands.size);
      const commandsToShow = Array.from(allCommands.values()).slice(
        startIndex,
        endIndex
      );

      const embed = new EmbedBuilder()
        .setTitle("Liste des Commandes")
        .setDescription("Voici la liste de toutes les commandes disponibles :")
        .setColor("#0099ff")
        .setFooter({ text: `Page ${page}/${totalPages}` });

      commandsToShow.forEach((command) => {
        embed.addFields({
          name: `/${command.data.name}`,
          value: command.data.description,
        });
      });

      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("Précédent")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Suivant")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(totalPages === 1 || currentPage === totalPages)
    );

    const helpEmbed = await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [row] : [],
    });

    if (totalPages > 1) {
      const collector = helpEmbed.createMessageComponentCollector({
        filter: (i) =>
          i.customId === "previous" ||
          (i.customId === "next" && i.user.id === interaction.user.id),
        time: 60000, // Temps d'inactivité avant l'arrêt du collecteur (60 secondes)
      });

      collector.on("collect", async (i) => {
        if (i.customId === "previous" && currentPage > 1) {
          currentPage--;
        } else if (i.customId === "next" && currentPage < totalPages) {
          currentPage++;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("previous")
                .setLabel("Précédent")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
              new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Suivant")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
            ),
          ],
        });
      });

      collector.on("end", () => {
        interaction.editReply({ components: [] }).catch(() => {}); // Supprimer les boutons à la fin
      });
    }
  },
};
