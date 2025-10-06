const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tamyasaklakaldir")
    .setDescription("Kullanıcının yasaklamasını ana ve yan sunuculardan kaldırır.")
    .addStringOption((option) =>
      option
        .setName("kullaniciid")
        .setDescription("Yasağı kaldırılacak kullanıcının ID'si")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("sebep")
        .setDescription("Yasağı kaldırma sebebi")
        .setRequired(false),
    ),

  async execute(interaction) {
    const allowedRoleId = process.env.ROLEID;
    const logChannelId = process.env.LOGCHANNELID;
    const secondaryGuildIds = process.env.EXTRA_GUILDS?.split(",") || [];

    const userId = interaction.options.getString("kullaniciid");
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
    const executor = interaction.user;

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için yetkin yok.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ Yasak Kaldırıldı")
      .setDescription(`\`${userId}\` ID'li kullanıcının yasağı kaldırıldı.`)
      .addFields(
        { name: "Sebep", value: reason },
        { name: "Yetkili", value: `${executor.tag} (${executor.id})` },
      )
      .setColor("Green")
      .setTimestamp();

    try {
      // Ana sunucudan ban kaldır
      await interaction.guild.bans.remove(userId).catch(() => {});

      // Yan sunuculardan ban kaldır
      for (const guildId of secondaryGuildIds) {
        const guild = interaction.client.guilds.cache.get(guildId);
        if (guild) {
          try {
            await guild.bans.remove(userId).catch(() => {});
          } catch (e) {
            console.error(`[${guild.name}] sunucusunda yasak kaldırma hatası:`, e);
          }
        }
      }

      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (logChannel) await logChannel.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("Yasak kaldırma hatası:", err);
      return interaction.reply({ content: "❌ Yasak kaldırılırken hata oluştu." });
    }
  },
};
