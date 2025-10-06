const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const nbx = require('noblox.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbedegistir')
    .setDescription('Bir kullanıcıya istediğin rütbeyi verir.')
    .addStringOption(option =>
      option.setName('kullanici').setDescription('Roblox kullanıcı adı').setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('rank').setDescription('Verilecek rütbe numarası').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep').setDescription('Sebep').setRequired(true)
    ),

  async execute(interaction) {
    const groupId = Number(process.env.GROUPID);
    const adminRoleId = process.env.ROLEID;
    const logChannelId = process.env.LOGCHANNELID;

    if (!interaction.member.roles.cache.has(adminRoleId))
      return interaction.reply({ content: '❌ Yetkin yok.' });

    const username = interaction.options.getString('kullanici');
    const newRank = interaction.options.getInteger('rank');
    const reason = interaction.options.getString('sebep');
    const executor = interaction.user; // Komutu kullanan kişi

    try {
      const userId = await nbx.getIdFromUsername(username);
      const oldRank = await nbx.getRankInGroup(groupId, userId);
      const oldRankName = await nbx.getRankNameInGroup(groupId, userId);

      await nbx.setRank(groupId, userId, newRank);
      const newRankName = await nbx.getRankNameInGroup(groupId, userId);

      const embed = new EmbedBuilder()
        .setTitle('📌 Rütbe Değişikliği')
        .addFields(
          { name: '👤 Kullanıcı', value: `${username} (ID: ${userId})` },
          { name: '🔻 Eski Rütbe', value: `${oldRank} - ${oldRankName}`, inline: true },
          { name: '🔺 Yeni Rütbe', value: `${newRank} - ${newRankName}`, inline: true },
          { name: '📝 Sebep', value: reason },
          { name: '🛠️ Yetkili', value: `${executor.tag} (${executor.id})` } // Ekleyen kişi
        )
        .setColor('Blue')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (logChannel) await logChannel.send({ embeds: [embed] });

    } catch (err) {
      console.error('SetRank Hatası:', err);
      return interaction.reply({ content: '❌ Hata oluştu.' });
    }
  }
};
