const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Botun komutları hakkında bilgi verir.'),

  async execute(interaction) {
    const adminRoleId = process.env.ROLEID;

    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({
        content: '❌ Bu komutu sadece yetkililer kullanabilir.',
        ephemeral: true
      });
    }

    const embeds = {
      genel: new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📘 Genel Komutlar')
        .setDescription('Botun genel komutları aşağıdadır:')
        .addFields(
          { name: '/yardim', value: 'Yardım menüsünü gösterir.', inline: false },
          { name: '/ban', value: 'Bir kullanıcıyı gruptan banlar.', inline: false },  
          { name: '/rütbe', value: 'Bir kullanıcının rütbesine bakar.', inline: false },
          { name: '/gruplar', value: 'Kullanıcının grup listesini gösterir.', inline: false },
          { name: '/cekilis', value: 'Bir çekiliş başlatır.', inline: false }
        ),

      rütbe: new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🛡️ Rütbe Komutları')
        .setDescription('Kullanıcılara rütbe işlemleri için komutlar:')
        .addFields(
          { name: '/rutbedegistir', value: 'Belirli bir rütbeyi verir.', inline: false },
          { name: '/promote', value: 'Bir üst rütbeye çıkarır.', inline: false },
          { name: '/demote', value: 'Bir alt rütbeye indirir.', inline: false }
        )
    };

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('yardim_menu')
        .setPlaceholder('Bir kategori seç...')
        .addOptions([
          {
            label: 'Genel Komutlar',
            value: 'genel',
            description: 'Botun genel komutları'
          },
          {
            label: 'Rütbe Komutları',
            value: 'rütbe',
            description: 'Rütbe verme, terfi/tenzil işlemleri'
          }
        ])
    );

    await interaction.reply({
      embeds: [embeds.genel],
      components: [row],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId === 'yardim_menu',
      time: 60000
    });

    collector.on('collect', async i => {
      const selected = i.values[0];
      await i.update({ embeds: [embeds[selected]], components: [row] });
    });

    collector.on('end', async () => {
      try {
        const msg = await interaction.fetchReply();
        await msg.edit({ components: [] });
      } catch (_) {}
    });
  }
};
