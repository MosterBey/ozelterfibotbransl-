const { EmbedBuilder } = require('discord.js');
const nbx = require('noblox.js');

async function tryExile(groupId, userId, reason) {
  try {
    return await nbx.exile(groupId, userId, reason);
  } catch (err) {
    if (err.message.includes('X-CSRF-TOKEN')) {
      console.warn('[Exile] CSRF token hatası. Cookie yeniden ayarlanıyor...');
      await nbx.setCookie(process.env.COOKIE);
      await new Promise(res => setTimeout(res, 1500));
      return await nbx.exile(groupId, userId, reason);
    }
    throw err;
  }
}

module.exports = {
  name: 'ban',
  description: 'Bir kullanıcıyı gruptan banlar.',
  options: [
    {
      name: 'kullanici',
      description: 'Banlanacak Roblox kullanıcı adı',
      type: 3,
      required: true,
    },
    {
      name: 'sebep',
      description: 'Ban sebebi',
      type: 3,
      required: false,
    }
  ],
  async execute(interaction) {
    const groupId = Number(process.env.GROUPID);
    const adminRoleId = process.env.ROLEID;
    const logChannelId = process.env.LOGCHANNELID;

    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmaya yetkin yok.', ephemeral: true });
    }

    const username = interaction.options.getString('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = await nbx.getIdFromUsername(username);
      if (!userId) {
        return interaction.editReply({ content: `❌ **${username}** adlı kullanıcı bulunamadı.` });
      }

      const currentRank = await nbx.getRankInGroup(groupId, userId);
      if (currentRank === 0) {
        return interaction.editReply({ content: `❗ **${username}** zaten grupta değil.` });
      }

      await tryExile(groupId, userId, reason);

      const embed = new EmbedBuilder()
        .setTitle('🚫 Kullanıcı Gruptan Banlandı')
        .addFields(
          { name: '👤 Kullanıcı', value: `${username} (ID: ${userId})` },
          { name: '📄 Sebep', value: reason }
        )
        .setColor('DarkRed')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📌 Grup Ban Logu')
          .setDescription(`**${interaction.user.tag}** tarafından ban işlemi yapıldı.`)
          .addFields(
            { name: 'Kullanıcı', value: `${username} (ID: ${userId})` },
            { name: 'Sebep', value: reason }
          )
          .setColor('DarkRed')
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

    } catch (error) {
      console.error('[BAN KOMUT HATASI]', error.message, error.stack);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Bir hata oluştu, tekrar deneyin.', ephemeral: true });
      } else {
        await interaction.editReply({ content: '❌ Bir hata oluştu, tekrar deneyin.' });
      }
    }
  }
};
