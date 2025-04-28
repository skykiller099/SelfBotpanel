// commands/listServers.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("Liste les serveurs d'un self-bot")
    .addIntegerOption((option) =>
      option.setName("id").setDescription("ID du self-bot").setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.options.getInteger("id");

    const result = selfbotHandler.getServerList(id);

    if (!result.success) {
      return interaction.editReply(result.message);
    }

    if (result.data.length === 0) {
      return interaction.editReply(
        `Le self-bot #${id} n'est présent sur aucun serveur.`
      );
    }

    const totalServers = result.data.length;
    let currentPage = 0;
    const serversPerPage = 10;
    const totalPages = Math.ceil(totalServers / serversPerPage);

    const generateEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle(`Serveurs du Self-bot #${id}`)
        .setColor("#0099ff")
        .setDescription(
          `Total de ${totalServers} serveurs (Page ${page + 1}/${totalPages})`
        )
        .setFooter({ text: "Utilisez les boutons pour naviguer" })
        .setTimestamp();

      const start = page * serversPerPage;
      const end = Math.min(start + serversPerPage, totalServers);

      for (let i = start; i < end; i++) {
        const server = result.data[i];
        embed.addFields({
          name: `${i + 1}. ${server.name}`,
          value:
            `ID: ${server.id}\n` +
            `Membres: ${server.memberCount}\n` +
            `Propriétaire: ${server.ownerId}`,
        });
      }

      return embed;
    };

    await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: [], // Vous pouvez ajouter des boutons de navigation ici si nécessaire
    });
  },
};
