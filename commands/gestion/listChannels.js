// commands/listChannels.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("channels")
    .setDescription("Liste les canaux d'un serveur pour un self-bot")
    .addIntegerOption((option) =>
      option.setName("id").setDescription("ID du self-bot").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("serverid")
        .setDescription("ID du serveur")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.options.getInteger("id");
    const serverId = interaction.options.getString("serverid");

    const result = selfbotHandler.getChannelList(id, serverId);

    if (!result.success) {
      return interaction.editReply(result.message);
    }

    if (result.data.length === 0) {
      return interaction.editReply(
        `Aucun canal trouvé sur le serveur ${serverId}.`
      );
    }

    // Filtrer par types de canaux
    const textChannels = result.data.filter((c) => c.type === 0);
    const voiceChannels = result.data.filter((c) => c.type === 2);
    const categoryChannels = result.data.filter((c) => c.type === 4);

    const embed = new EmbedBuilder()
      .setTitle(`Canaux sur le serveur`)
      .setColor("#0099ff")
      .setDescription(`Total de ${result.data.length} canaux`)
      .setTimestamp();

    if (categoryChannels.length > 0) {
      let categoryList = "";
      categoryChannels.forEach((c) => {
        categoryList += `**${c.name}** - \`${c.id}\`\n`;
      });
      embed.addFields({ name: "📁 Catégories", value: categoryList });
    }

    if (textChannels.length > 0) {
      let textList = "";
      textChannels.forEach((c) => {
        textList += `**#${c.name}** - \`${c.id}\`\n`;
      });
      embed.addFields({ name: "💬 Canaux textuels", value: textList });
    }

    if (voiceChannels.length > 0) {
      let voiceList = "";
      voiceChannels.forEach((c) => {
        voiceList += `**🔊 ${c.name}** - \`${c.id}\`\n`;
      });
      embed.addFields({ name: "🔊 Canaux vocaux", value: voiceList });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
