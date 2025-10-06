const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gruplar')
    .setDescription('Bir Roblox kullanıcısının grup bilgilerini gösterir.')
    .addStringOption(option =>
      option.setName('kullanici')
        .setDescription('Roblox kullanıcı adı')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('kullanici');

    await interaction.deferReply(); // Herkese görünür yapmak için `ephemeral: true` KALDIRILDI

    try {
      const userId = await noblox.getIdFromUsername(username);
      const groups = await noblox.getGroups(userId);

      if (!groups || groups.length === 0) {
        return interaction.editReply({ content: `❌ ${username} hiçbir grupta değil.` });
      }

      const pages = [];
      const perPage = 5;

      for (let i = 0; i < groups.length; i += perPage) {
        const embed = new EmbedBuilder()
          .setTitle(`📋 ${username} - Grup Listesi (Sayfa ${Math.floor(i / perPage) + 1})`)
          .setColor('Blue')
          .setTimestamp();

        groups.slice(i, i + perPage).forEach(group => {
          embed.addFields({
            name: group.Name || 'Bilinmeyen Grup',
            value: `ID: \`${group.Id}\`\nRütbe: ${group.Role || 'Yok'} (Rank: ${group.Rank})`,
            inline: false
          });
        });

        pages.push(embed);
      }

      let currentPage = 0;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('⬅️ Geri')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('İleri ➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pages.length <= 1)
      );

      const reply = await interaction.editReply({
        embeds: [pages[currentPage]],
        components: [row]
      });

      const collector = reply.createMessageComponentCollector({
        time: 60000,
        filter: i => i.user.id === interaction.user.id
      });

      collector.on('collect', async i => {
        if (i.customId === 'next') {
          currentPage++;
        } else if (i.customId === 'prev') {
          currentPage--;
        }

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === pages.length - 1);

        await i.update({
          embeds: [pages[currentPage]],
          components: [row]
        });
      });

      collector.on('end', async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            row.components.map(btn => btn.setDisabled(true))
          );
          await reply.edit({ components: [disabledRow] });
        } catch (err) {
          // sessizce geç
        }
      });

    } catch (error) {
      console.error('❌ gruplar.js hata:', error);
      return interaction.editReply({ content: '❌ Kullanıcı bulunamadı ya da bir hata oluştu.' });
    }
  }
};
