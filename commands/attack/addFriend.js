// commands/addFriend.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const selfbotHandler = require("../../utils/selfbotHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addfriend")
    .setDescription("Envoie des demandes d'ami avec les self-bots")
    .addStringOption((option) =>
      option
        .setName("userid")
        .setDescription("ID de l'utilisateur")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode d'envoi")
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

    const userId = interaction.options.getString("userid");
    const mode = interaction.options.getString("mode");
    const intervalOption = interaction.options.getInteger("interval");
    const interval = intervalOption ? intervalOption * 1000 : 10000; // Par défaut 10 secondes pour éviter la détection

    const allSelfbots = selfbotHandler.getAllSelfbots();

    if (allSelfbots.length === 0) {
      return interaction.editReply("Aucun self-bot n'est configuré.");
    }

    if (mode === "all") {
      // Envoyer les demandes d'ami avec tous les self-bots en même temps
      await interaction.editReply(
        `Tentative d'envoi de demande d'ami à ${userId} avec ${allSelfbots.length} self-bots...`
      );

      const promises = allSelfbots.map((id) =>
        selfbotHandler.addFriend(id, userId)
      );
      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;

      await interaction.editReply(
        `${successCount}/${allSelfbots.length} self-bots ont envoyé une demande d'ami avec succès.`
      );
    } else {
      // Envoyer les demandes d'ami un par un avec un intervalle
      await interaction.editReply(
        `Début de l'envoi séquentiel des demandes d'ami à ${userId} avec ${
          allSelfbots.length
        } self-bots (intervalle: ${interval / 1000} secondes)...`
      );

      let successCount = 0;
      let failCount = 0;

      for (const id of allSelfbots) {
        const result = await selfbotHandler.addFriend(id, userId);

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        await interaction.editReply(
          `Progression: ${successCount + failCount}/${
            allSelfbots.length
          } self-bots traités\n` +
            `✅ Réussis: ${successCount}\n` +
            `❌ Échoués: ${failCount}\n` +
            `En cours: Self-bot #${id} ${
              result.success ? "a envoyé" : "n'a pas pu envoyer"
            } une demande d'ami.\n` +
            `Attente de ${interval / 1000} secondes avant le prochain...`
        );

        if (id !== allSelfbots[allSelfbots.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }

      await interaction.editReply(
        `Opération terminée!\n` +
          `Total: ${allSelfbots.length} self-bots\n` +
          `✅ Réussis: ${successCount}\n` +
          `❌ Échoués: ${failCount}`
      );
    }
  },
};
