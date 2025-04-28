// index.js
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
} = require("discord.js");
const fs = require("fs").promises; // Utilisation de fs.promises pour async/await
const path = require("path");
const config = require("./config.json");
require("dotenv").config(); // Pour charger les variables d'environnement
const selfbotHandler = require("./utils/selfbotHandler");

// Création du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Collection pour stocker les commandes
client.commands = new Collection();

// Fonction de chargement des commandes récursive
async function loadCommands(dir) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await loadCommands(filePath); // Recursion pour les sous-dossiers
      } else if (file.endsWith(".js")) {
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
          const relativePath = path.relative(__dirname, filePath);
          console.log(`[✓] Commande chargée: ${relativePath}`);
        } else {
          const relativePath = path.relative(__dirname, filePath);
          console.log(
            `[✗] La commande ${relativePath} manque une propriété "data" ou "execute" requise.`
          );
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement des commandes:", error);
  }
}

// Enregistrement et synchronisation des commandes slash
const rest = new REST({ version: "10" }).setToken(process.env.botToken);

async function registerCommands() {
  try {
    console.log(
      "Début de la suppression et de la resynchronisation des commandes slash..."
    );

    // Suppression globale des commandes (pour une resynchronisation propre)
    await rest.put(Routes.applicationCommands(process.env.clientId), {
      body: [],
    });
    console.log("Commandes slash globales supprimées.");

    const commands = [];
    for (const command of client.commands.values()) {
      commands.push(command.data.toJSON());
    }

    // Enregistrement global des nouvelles commandes
    await rest.put(Routes.applicationCommands(process.env.clientId), {
      body: commands,
    });

    console.log(
      `[${commands.length}] Commandes slash enregistrées et synchronisées avec succès!`
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des commandes:", error);
  }
}

// Gestion des interactions (commandes slash)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // Vérification de l'ID de l'owner
  const ownerIds = process.env.ownerId.split(","); // Permettre plusieurs IDs séparés par des virgules
  if (!ownerIds.includes(interaction.user.id)) {
    return await interaction.reply({
      content:
        "Vous devez être un cadre de l'équipe RTA pour utiliser cette commande.",
      ephemeral: false, // Changement ici pour que le message soit visible par tous
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

// Démarrage du bot
client.once("ready", async () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
  await registerCommands(); // Enregistrer les commandes après que le bot est prêt
});

async function main() {
  await loadCommands(path.join(__dirname, "commands")); // Charger les commandes
  client.login(process.env.botToken);
}

main();
