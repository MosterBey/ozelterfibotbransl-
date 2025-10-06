const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rütbe')
    .setDescription('Belirtilen kullanıcının gruptaki rütbesini gösterir.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adı')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');
    const groupId = Number(process.env.GROUPID);

    await interaction.deferReply();

    try {
      const userId = await noblox.getIdFromUsername(username);
      const rank = await noblox.getRankInGroup(groupId, userId);
      const roleName = await noblox.getRankNameInGroup(groupId, userId);

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${username} - Rütbe Bilgisi`)
        .addFields(
          { name: 'Rank', value: rank.toString(), inline: true },
          { name: 'Rütbe Adı', value: roleName || 'Yok', inline: true }
        )
        .setColor('DarkAqua')
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('rütbe.js Hatası:', err);
      return interaction.editReply({ content: '❌ Kullanıcı bulunamadı veya bir hata oluştu.' });
    }
  }
};
