const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tamyasakla')
    .setDescription('Kullanıcıyı ana ve belirli sunuculardan yasaklar.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Yasaklanacak kullanıcıyı seçin')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Yasaklama sebebi')
        .setRequired(false)
    ),

  async execute(interaction) {
    const allowedRoleId = process.env.ROLEID;
    const logChannelId = process.env.LOGCHANNELID;
    const secondaryGuildIds = process.env.EXTRA_GUILDS?.split(',') || [];

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok.', ephemeral: true });
    }

    const user = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

    const embed = new EmbedBuilder()
      .setTitle('⛔ Tam Yasaklama')
      .setDescription(`Kullanıcı ${user} (${user.id}) aşağıdaki sunuculardan yasaklandı:`)
      .setColor('Red')
      .addFields({ name: 'Sebep', value: reason })
      .setTimestamp();

    let yasaklananSunucular = [];

    try {
      // Ana sunucudan banla
      await interaction.guild.members.ban(user.id, { reason });
      yasaklananSunucular.push(`🔸 ${interaction.guild.name}`);

      // Yan sunuculardan da banla
      for (const guildId of secondaryGuildIds) {
        const guild = interaction.client.guilds.cache.get(guildId.trim());
        if (guild) {
          try {
            await guild.members.ban(user.id, { reason });
            yasaklananSunucular.push(`🔸 ${guild.name}`);
          } catch (e) {
            yasaklananSunucular.push(`⚠️ ${guild.name} (hata: ${e.message})`);
            console.error(`[${guild.name}] sunucusunda banlama başarısız:`, e);
          }
        }
      }

      embed.addFields({ name: 'Sunucular', value: yasaklananSunucular.join('\n') });

      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Yasaklama hatası:', err);
      return interaction.reply({ content: '❌ Yasaklama sırasında bir hata oluştu.' });
    }
  }
};
