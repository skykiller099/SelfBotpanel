// utils/selfbotHandler.js
const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs").promises;
const path = require("path");
const configPath = path.join(__dirname, "../config.json");

class SelfbotHandler {
    constructor() {
        this.selfbots = new Map();
        this.loadSelfbotsFromFile();
    }

    async loadSelfbotsFromFile() {
        try {
            const data = await fs.readFile(configPath, "utf8");
            const config = JSON.parse(data);
            const selfbotsData = config.selfbots || [];

            selfbotsData.forEach((selfbotInfo, index) => {
                try {
                    const client = new Client({
                        checkUpdate: false,
                        syncStatus: false,
                    });

                    this.selfbots.set(index, {
                        client,
                        token: selfbotInfo.token,
                        connected: false,
                        id: index,
                    });

                    console.log(`[Self-bot ${index}] Chargé depuis le fichier`);
                } catch (error) {
                    console.error(
                        `[Self-bot ${index}] Erreur lors du chargement depuis le fichier:`,
                        error
                    );
                }
            });

            console.log(`${this.selfbots.size} self-bots chargés au total depuis le fichier`);
        } catch (error) {
            console.error("Erreur lors de la lecture du fichier de configuration:", error);
            console.log("Aucun self-bot chargé.");
        }
    }

    async saveSelfbotsToFile() {
        try {
            const selfbotsToSave = Array.from(this.selfbots.values()).map(
                (selfbot) => ({ token: selfbot.token })
            );
            const config = { selfbots: selfbotsToSave };
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
            console.log("Configuration des self-bots sauvegardée dans le fichier.");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du fichier de configuration:", error);
        }
    }

    async connectSelfbot(id) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (selfbot.connected)
            return { success: true, message: `Self-bot #${id} déjà connecté` };

        try {
            await selfbot.client.login(selfbot.token);
            selfbot.connected = true;
            return { success: true, message: `Self-bot #${id} connecté avec succès` };
        } catch (error) {
            console.error(`[Self-bot ${id}] Erreur de connexion:`, error);
            return {
                success: false,
                message: `Erreur de connexion du self-bot #${id}: ${error.message}`,
            };
        }
    }

    async disconnectSelfbot(id) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected)
            return { success: true, message: `Self-bot #${id} déjà déconnecté` };

        try {
            await selfbot.client.destroy();
            selfbot.connected = false;
            return {
                success: true,
                message: `Self-bot #${id} déconnecté avec succès`,
            };
        } catch (error) {
            console.error(`[Self-bot ${id}] Erreur de déconnexion:`, error);
            return {
                success: false,
                message: `Erreur de déconnexion du self-bot #${id}: ${error.message}`,
            };
        }
    }

    async joinServer(id, inviteLink) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected) {
            const connectResult = await this.connectSelfbot(id);
            if (!connectResult.success) return connectResult;
        }

        try {
            // Nettoyage du lien d'invitation
            const inviteCode = inviteLink.replace(
                /(https?:\/\/)?(www\.)?(discord\.gg\/|discord\.com\/invite\/)/g,
                ""
            );

            await selfbot.client.acceptInvite(inviteCode);
            return {
                success: true,
                message: `Self-bot #${id} a rejoint le serveur avec succès`,
            };
        } catch (error) {
            console.error(
                `[Self-bot ${id}] Erreur lors de la jonction au serveur:`,
                error
            );
            return {
                success: false,
                message: `Erreur lors de la jonction au serveur pour le self-bot #${id}: ${error.message}`,
            };
        }
    }

    async leaveServer(id, serverId) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected) {
            const connectResult = await this.connectSelfbot(id);
            if (!connectResult.success) return connectResult;
        }

        try {
            const guild = selfbot.client.guilds.cache.get(serverId);
            if (!guild) {
                return {
                    success: false,
                    message: `Self-bot #${id} n'est pas présent sur le serveur ${serverId}`,
                };
            }

            await guild.leave();
            return {
                success: true,
                message: `Self-bot #${id} a quitté le serveur avec succès`,
            };
        } catch (error) {
            console.error(
                `[Self-bot ${id}] Erreur lors du départ du serveur:`,
                error
            );
            return {
                success: false,
                message: `Erreur lors du départ du serveur pour le self-bot #${id}: ${error.message}`,
            };
        }
    }

    async sendMessage(id, serverId, channelId, content) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected) {
            const connectResult = await this.connectSelfbot(id);
            if (!connectResult.success) return connectResult;
        }

        try {
            const guild = selfbot.client.guilds.cache.get(serverId);
            if (!guild) {
                return {
                    success: false,
                    message: `Self-bot #${id} n'est pas présent sur le serveur ${serverId}`,
                };
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return {
                    success: false,
                    message: `Canal ${channelId} non trouvé dans le serveur ${serverId}`,
                };
            }

            await channel.send(content);
            return {
                success: true,
                message: `Message envoyé avec succès par le self-bot #${id}`,
            };
        } catch (error) {
            console.error(`[Self-bot ${id}] Erreur d'envoi de message:`, error);
            return {
                success: false,
                message: `Erreur d'envoi de message pour le self-bot #${id}: ${error.message}`,
            };
        }
    }

    // Récupérer la liste de tous les selfbots
    getAllSelfbots() {
        return Array.from(this.selfbots.keys());
    }

    // Récupérer un selfbot spécifique par ID
    getSelfbot(id) {
        return this.selfbots.get(id);
    }

    // Connecter tous les selfbots en même temps
    async connectAll() {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.connectSelfbot(id).then((result) => {
                    results.push({ id, ...result });
                })
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Déconnecter tous les selfbots en même temps
    async disconnectAll() {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.disconnectSelfbot(id).then((result) => {
                    results.push({ id, ...result });
                })
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Faire rejoindre un serveur à tous les selfbots en même temps
    async massJoinServer(inviteLink) {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.joinServer(id, inviteLink).then((result) => {
                    results.push({ id, ...result });
                })
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Faire rejoindre un serveur séquentiellement avec un délai entre chaque
    async sequentialJoinServer(inviteLink, delayMs = 30000) {
        const results = [];

        for (const [id] of this.selfbots) {
            const result = await this.joinServer(id, inviteLink);
            results.push({ id, ...result });

            if (id !== Array.from(this.selfbots.keys()).pop()) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        return { success: true, results };
    }

    // Faire quitter un serveur à tous les selfbots en même temps
    async massLeaveServer(serverId) {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.leaveServer(id, serverId).then((result) => {
                    results.push({ id, ...result });
                })
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Faire quitter un serveur séquentiellement avec un délai entre chaque
    async sequentialLeaveServer(serverId, delayMs = 30000) {
        const results = [];

        for (const [id] of this.selfbots) {
            const result = await this.leaveServer(id, serverId);
            results.push({ id, ...result });

            if (id !== Array.from(this.selfbots.keys()).pop()) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        return { success: true, results };
    }

    // Faire envoyer un message à tous les selfbots en même temps
    async massSendMessage(serverId, channelId, content) {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.sendMessage(id, serverId, channelId, content).then((result) => {
                    results.push({ id, ...result });
                })
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Faire envoyer un message séquentiellement avec un délai entre chaque
    async sequentialSendMessage(serverId, channelId, content, delayMs = 30000) {
        const results = [];

        for (const [id] of this.selfbots) {
            const result = await this.sendMessage(id, serverId, channelId, content);
            results.push({ id, ...result });

            if (id !== Array.from(this.selfbots.keys()).pop()) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        return { success: true, results };
    }

    // Changer le statut d'un selfbot
    async changeStatus(id, status, activityType, activityName) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected) {
            const connectResult = await this.connectSelfbot(id);
            if (!connectResult.success) return connectResult;
        }

        try {
            await selfbot.client.user.setStatus(status || "online");

            if (activityType && activityName) {
                await selfbot.client.user.setActivity(activityName, {
                    type: activityType,
                });
            }

            return {
                success: true,
                message: `Statut du self-bot #${id} modifié avec succès`,
            };
        } catch (error) {
            console.error(`[Self-bot ${id}] Erreur de changement de statut:`, error);
            return {
                success: false,
                message: `Erreur de changement de statut pour le self-bot #${id}: ${error.message}`,
            };
        }
    }

    // Changer le statut de tous les selfbots en même temps
    async massChangeStatus(status, activityType, activityName) {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.changeStatus(id, status, activityType, activityName).then(
                    (result) => {
                        results.push({ id, ...result });
                    }
                )
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Réagir à un message avec un selfbot
    async reactToMessage(id, serverId, channelId, messageId, emoji) {
        const selfbot = this.selfbots.get(id);
        if (!selfbot)
            return { success: false, message: `Self-bot #${id} n'existe pas` };

        if (!selfbot.connected) {
            const connectResult = await this.connectSelfbot(id);
            if (!connectResult.success) return connectResult;
        }

        try {
            const guild = selfbot.client.guilds.cache.get(serverId);
            if (!guild) {
                return {
                    success: false,
                    message: `Self-bot #${id} n'est pas présent sur le serveur ${serverId}`,
                };
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return {
                    success: false,
                    message: `Canal ${channelId} non trouvé dans le serveur ${serverId}`,
                };
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                return {
                    success: false,
                    message: `Message ${messageId} non trouvé dans le canal ${channelId}`,
                };
            }

            await message.react(emoji);
            return {
                success: true,
                message: `Réaction ajoutée avec succès par le self-bot #${id}`,
            };
        } catch (error) {
            console.error(`[Self-bot ${id}] Erreur d'ajout de réaction:`, error);
            return {
                success: false,
                message: `Erreur d'ajout de réaction pour le self-bot #${id}: ${error.message}`,
            };
        }
    }

    // Faire réagir tous les selfbots à un message
    async massReactToMessage(serverId, channelId, messageId, emoji) {
        const results = [];
        const promises = [];

        for (const [id] of this.selfbots) {
            promises.push(
                this.reactToMessage(id, serverId, channelId, messageId, emoji).then(
                    (result) => {
                        results.push({ id, ...result });
                    }
                )
            );
        }

        await Promise.all(promises);
        return { success: true, results };
    }

    // Faire réagir les selfbots séquentiellement à un message
    async sequentialReactToMessage(
        serverId,
        channelId,
        messageId,
        emoji,
        delayMs = 5000
    ) {
        const results = [];

        for (const [id] of this.selfbots) {
            const result = await this.reactToMessage(
                id,
                serverId,
                channelId,
                messageId,
                emoji
            );
            results.push({ id, ...result });

              if (id !== Array.from(this.selfbots.keys()).pop()) {
                  await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
          }
  
          return { success: true, results };
      }
  
      // Obtenir les informations d'un selfbot
      getSelfbotInfo(id) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          return {
              success: true,
              data: {
                  id: selfbot.id,
                  connected: selfbot.connected,
                  username: selfbot.connected ? selfbot.client.user.tag : null,
                  userId: selfbot.connected ? selfbot.client.user.id : null,
                  guilds: selfbot.connected ? selfbot.client.guilds.cache.size : 0,
                  status: selfbot.connected
                      ? selfbot.client.presence?.status || "offline"
                      : "offline",
              },
          };
      }
  
      // Obtenir les informations de tous les selfbots
      getAllSelfbotsInfo() {
          const infos = [];
  
          for (const [id] of this.selfbots) {
              const info = this.getSelfbotInfo(id);
              if (info.success) {
                  infos.push(info.data);
              }
          }
  
          return { success: true, data: infos };
      }
  
      async addSelfbot(token) {
          try {
              const id = this.selfbots.size;
              const client = new Client({
                  checkUpdate: false,
                  syncStatus: false,
              });
  
              this.selfbots.set(id, {
                  client,
                  token,
                  connected: false,
                  id,
              });
  
              await this.saveSelfbotsToFile();
  
              console.log(`[Self-bot ${id}] Ajouté et sauvegardé dans le fichier`);
              return {
                  success: true,
                  message: `Self-bot #${id} ajouté avec succès et sauvegardé`,
                  data: { id },
              };
          } catch (error) {
              console.error(`Erreur lors de l'ajout d'un self-bot:`, error);
              return {
                  success: false,
                  message: `Erreur lors de l'ajout d'un self-bot: ${error.message}`,
              };
          }
      }
  
      async removeSelfbot(id) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (selfbot.connected) {
              await selfbot.client.destroy();
          }
  
          this.selfbots.delete(id);
          await this.saveSelfbotsToFile();
          console.log(`[Self-bot ${id}] Supprimé et configuration mise à jour`);
          return { success: true, message: `Self-bot #${id} supprimé avec succès` };
      }
  
      // Obtenir la liste des serveurs d'un selfbot
      getServerList(id) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              return { success: false, message: `Self-bot #${id} n'est pas connecté` };
          }
  
          try {
              const servers = [];
  
              selfbot.client.guilds.cache.forEach((guild) => {
                  servers.push({
                      id: guild.id,
                      name: guild.name,
                      memberCount: guild.memberCount,
                      ownerId: guild.ownerId,
                      icon: guild.iconURL(),
                  });
              });
  
              return { success: true, data: servers };
          } catch (error) {
              console.error(
                  `[Self-bot ${id}] Erreur de récupération des serveurs:`,
                  error
              );
              return {
                  success: false,
                  message: `Erreur de récupération des serveurs pour le self-bot #${id}: ${error.message}`,
              };
          }
      }
  
      // Obtenir la liste des canaux d'un serveur pour un selfbot
      getChannelList(id, serverId) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              return { success: false, message: `Self-bot #${id} n'est pas connecté` };
          }
  
          try {
              const guild = selfbot.client.guilds.cache.get(serverId);
              if (!guild) {
                  return {
                      success: false,
                      message: `Self-bot #${id} n'est pas présent sur le serveur ${serverId}`,
                  };
              }
  
              const channels = [];
  
              guild.channels.cache.forEach((channel) => {
                  channels.push({
                      id: channel.id,
                      name: channel.name,
                      type: channel.type,
                      parentId: channel.parentId,
                  });
              });
  
              return { success: true, data: channels };
          } catch (error) {
              console.error(
                  `[Self-bot ${id}] Erreur de récupération des canaux:`,
                  error
              );
              return {
                  success: false,
                  message: `Erreur de récupération des canaux pour le self-bot #${id}: ${error.message}`,
              };
          }
      }
  
      // Envoyer un message privé avec un selfbot
      async sendDirectMessage(id, userId, content) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              const connectResult = await this.connectSelfbot(id);
              if (!connectResult.success) return connectResult;
          }
  
          try {
              const user = await selfbot.client.users.fetch(userId);
              if (!user) {
                  return { success: false, message: `Utilisateur ${userId} non trouvé` };
              }
  
              const dm = await user.createDM();
              await dm.send(content);
  
              return {
                  success: true,
                  message: `Message privé envoyé avec succès par le self-bot #${id}`,
              };
          } catch (error) {
              console.error(`[Self-bot ${id}] Erreur d'envoi de message privé:`, error);
              return {
                  success: false,
                  message: `Erreur d'envoi de message privé pour le self-bot #${id}: ${error.message}`,
              };
          }
      }
  
      // Envoyer un message massif en DM à une liste d'utilisateurs
      async massSendDirectMessage(userIds, content, delayMs = 5000) {
          const results = [];
  
          for (const [id] of this.selfbots) {
              for (const userId of userIds) {
                  const result = await this.sendDirectMessage(id, userId, content);
                  results.push({ id, userId, ...result });
  
                  await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
          }
  
          return { success: true, results };
      }
  
      // Définir la photo de profil d'un selfbot
      async setAvatar(id, avatarUrl) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              const connectResult = await this.connectSelfbot(id);
              if (!connectResult.success) return connectResult;
          }
  
          try {
              await selfbot.client.user.setAvatar(avatarUrl);
              return {
                  success: true,
                  message: `Avatar du self-bot #${id} modifié avec succès`,
              };
          } catch (error) {
              console.error(`[Self-bot ${id}] Erreur de changement d'avatar:`, error);
              return {
                  success: false,
                  message: `Erreur de changement d'avatar pour le self-bot #${id}: ${error.message}`,
              };
          }
      }
  
      // Définir le pseudo d'un selfbot sur un serveur
      async setNickname(id, serverId, nickname) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              const connectResult = await this.connectSelfbot(id);
              if (!connectResult.success) return connectResult;
          }
  
          try {
              const guild = selfbot.client.guilds.cache.get(serverId);
              if (!guild) {
                  return {
                      success: false,
                      message: `Self-bot #${id} n'est pas présent sur le serveur ${serverId}`,
                  };
              }
  
              await guild.members.me.setNickname(nickname);
              return {
                  success: true,
                  message: `Pseudo du self-bot #${id} modifié avec succès sur le serveur`,
              };
          } catch (error) {
              console.error(`[Self-bot ${id}] Erreur de changement de pseudo:`, error);
              return {
                  success: false,
                  message: `Erreur de changement de pseudo pour le self-bot #${id}: ${error.message}`,
              };
          }
      }
  
      // Définir les pseudos de tous les selfbots sur un serveur
      async massSetNickname(serverId, nickname) {
          const results = [];
          const promises = [];
  
          for (const [id] of this.selfbots) {
              promises.push(
                  this.setNickname(id, serverId, nickname).then((result) => {
                      results.push({ id, ...result });
                  })
              );
          }
  
          await Promise.all(promises);
          return { success: true, results };
      }
  
      async addFriend(id, userId) {
          const selfbot = this.selfbots.get(id);
          if (!selfbot)
              return { success: false, message: `Self-bot #${id} n'existe pas` };
  
          if (!selfbot.connected) {
              const connectResult = await this.connectSelfbot(id);
              if (!connectResult.success) return connectResult;
          }
  
          try {
              const user = await selfbot.client.users.fetch(userId);
              if (!user) {
                  return { success: false, message: `Utilisateur ${userId} non trouvé` };
              }
  
              await user.sendFriendRequest();
              return {
                  success: true,
                  message: `Demande d'ami envoyée avec succès par le self-bot #${id} à ${userId}`,
              };
          } catch (error) {
              console.error(`[Self-bot ${id}] Erreur lors de l'envoi de la demande d'ami à ${userId}:`, error);
              return {
                  success: false,
                  message: `Erreur lors de l'envoi de la demande d'ami par le self-bot #${id} à ${userId}: ${error.message}`,
              };
          }
      }
  }
  
  module.exports = new SelfbotHandler();