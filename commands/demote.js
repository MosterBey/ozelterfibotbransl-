const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const nbx = require('noblox.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Kullanıcıyı rütbe düşürür.')
    .addStringOption(option =>
      option.setName('kullanici').setDescription('Roblox kullanıcı adı').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep').setDescription('Sebep').setRequired(false)
    ),

  async execute(interaction) {
    const groupId = Number(process.env.GROUPID);
    const roleId = process.env.ROLEID;
    const logChannelId = process.env.LOGCHANNELID;
    const executor = interaction.user;

    if (!interaction.member.roles.cache.has(roleId))
      return interaction.reply({ content: '❌ Yetkin yok.' });

    const username = interaction.options.getString('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

    try {
      const userId = await nbx.getIdFromUsername(username);
      const oldRankName = await nbx.getRankNameInGroup(groupId, userId);

      await nbx.demote(groupId, userId);

      const newRankName = await nbx.getRankNameInGroup(groupId, userId);

      const embed = new EmbedBuilder()
        .setTitle('📉 Tenzil Edildi')
        .addFields(
          { name: '👤 Kullanıcı', value: `${username} (ID: ${userId})` },
          { name: '🔻 Eski Rütbe', value: `${oldRankName}`, inline: true },
          { name: '🔺 Yeni Rütbe', value: `${newRankName}`, inline: true },
          { name: '📝 Sebep', value: reason },
          { name: '🛠️ Yetkili', value: `${executor.tag} (${executor.id})` }
        )
        .setColor('Red')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (logChannel) await logChannel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Demote Hatası:', err);
      return interaction.reply({ content: '❌ Hata oluştu.' });
    }
  }
};
