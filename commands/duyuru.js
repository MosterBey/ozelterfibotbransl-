const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Belirlenen sunucuların belirlenen kanallarında duyuru yapar.")
    .addStringOption((option) =>
      option
        .setName("mesaj")
        .setDescription("Gönderilecek duyuru mesajı")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // sadece adminler kullanabilir

  async execute(interaction) {
    const mesaj = interaction.options.getString("mesaj");

    // .env dosyasında: DUYURU_CHANNELS=guildId1:channelId1,guildId2:channelId2
    const pairs = process.env.DUYURU_CHANNELS?.split(",") || [];

    if (!pairs.length) {
      return interaction.reply({
        content: "❌ Duyuru yapılacak kanal ID'leri tanımlı değil.",
        flags: MessageFlags.Ephemeral, // ✅ v14 uyumlu
      });
    }

    let basarili = 0;
    let hatali = 0;

    for (const pair of pairs) {
      try {
        const [guildId, channelId] = pair.split(":");

        const guild = interaction.client.guilds.cache.get(guildId);
        if (!guild) {
          hatali++;
          continue;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
          hatali++;
          continue;
        }

        await channel.send(`📢 **DUYURU**\n${mesaj}`);
        basarili++;
      } catch (err) {
        console.error("Duyuru gönderilemedi:", err);
        hatali++;
      }
    }

    return interaction.reply({
      content: `✅ ${basarili} kanala duyuru gönderildi. ❌ ${hatali} hata.`,
      flags: MessageFlags.Ephemeral, // ✅ v14 uyumlu
    });
  },
};
