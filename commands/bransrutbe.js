const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const nbx = require('noblox.js');

function parseBranslarEnv() {
  return (process.env.BRANSLAR || '').split(',').map(pair => {
    const [name, id] = pair.split(':').map(s => s.trim());
    return { name, id: Number(id) };
  });
}

const branches = parseBranslarEnv();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bransrutbe')
    .setDescription('Bir kullanıcıyı branş ve rütbesi ile ayarlayın.')
    .addStringOption(opt =>
      opt.setName('username')
        .setDescription('Roblox kullanıcı adı')
        .setRequired(true)
    )
    .addStringOption(opt => {
      const option = opt.setName('brans').setDescription('Branş seçiniz').setRequired(true);
      branches.forEach(b => option.addChoices({ name: b.name, value: String(b.id) }));
      return option;
    }),

  async execute(interaction, client) {
    const adminRole = process.env.ROLEID;
    if (!interaction.member.roles.cache.has(adminRole))
      return interaction.reply({ content: '❌ Yetkin yok.', ephemeral: true });

    const username = interaction.options.getString('username');
    const bransGroupId = Number(interaction.options.getString('brans'));
    const bransName = branches.find(b => b.id === bransGroupId)?.name || 'Bilinmiyor';

    await interaction.deferReply({ ephemeral: true });

    try {
      const roles = await nbx.getRoles(bransGroupId);
      const roleOptions = roles
        .filter(r => r.rank > 0)
        .map(r => ({ label: r.name.slice(0, 100), value: String(r.rank) }));

      if (!roleOptions.length)
        return interaction.editReply('❌ Bu branşta rütbe bulunamadı.');

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`rankSelect_${interaction.id}`)
          .setPlaceholder('Rütbe seçiniz')
          .addOptions(roleOptions.slice(0, 25))
      );

      if (!client.tempBransUser) client.tempBransUser = new Map();
      client.tempBransUser.set(interaction.user.id, { username, bransGroupId, roles: roleOptions, bransName });

      await interaction.editReply({ content: '✅ Rütbeyi seçiniz:', components: [row] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Hata oluştu: ${err.message || err}` });
    }
  },

  async selectMenu(interaction, client) {
    const data = client.tempBransUser.get(interaction.user.id);
    if (!data) return interaction.reply({ content: '❌ İşlem zaman aşımına uğradı.', ephemeral: true });

    const { username, bransGroupId, roles, bransName } = data;
    const selectedRank = Number(interaction.values[0]);

    await interaction.deferReply({ ephemeral: true });

    try {
      const userId = await nbx.getIdFromUsername(username);
      const oldRankName = await nbx.getRankNameInGroup(bransGroupId, userId);

      await nbx.setRank(bransGroupId, userId, selectedRank);

      const newRankName = roles.find(r => Number(r.value) === selectedRank)?.label || 'Bilinmiyor';

      const embed = new EmbedBuilder()
        .setTitle('📌 Branş Rütbe Değişikliği')
        .addFields(
          { name: '👤 Kullanıcı', value: `${username} (ID: ${userId})` },
          { name: '🗂️ Branş', value: bransName, inline: true },
          { name: '🔻 Eski Rütbe', value: `${oldRankName}`, inline: true },
          { name: '🔺 Yeni Rütbe', value: `${newRankName}`, inline: true },
          { name: '🛠️ Yetkili', value: `${interaction.user.tag} (${interaction.user.id})` }
        )
        .setColor('Blue')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], components: [] });

      // Log kanalı
      try {
        const logChannelId = process.env.LOGCHANNELID;
        const logChannel = await interaction.guild.channels.fetch(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({ embeds: [embed] });
        } else {
          console.warn('❌ Log kanalı bulunamadı veya text kanalı değil.');
        }
      } catch (logErr) {
        console.error('Log kanalı hatası:', logErr);
      }

      client.tempBransUser.delete(interaction.user.id);

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Rütbe değiştirilirken hata oluştu: ${err.message || err}`, components: [] });
    }
  }
};
