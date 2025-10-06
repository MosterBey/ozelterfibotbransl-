const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let entries = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cekilis')
    .setDescription('Bir çekiliş başlatır.')
    .addStringOption(opt =>
      opt.setName('odul')
        .setDescription('Verilecek ödül (örnek: 1 Aylık Nitro)')
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('sure')
        .setDescription('Çekiliş süresi (saniye cinsinden)')
        .setRequired(true)),

  async execute(interaction) {
    const roleId = process.env.ROLEID; // Rol ID'yi ortam değişkeninden al
    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.reply({
        content: '❌ Bu komutu kullanmak için yetkin yok.',
        ephemeral: true
      });
    }

    const odul = interaction.options.getString('odul');
    const sure = interaction.options.getInteger('sure');

    entries = []; // Her çekilişte sıfırlanır

    const embed = new EmbedBuilder()
      .setTitle('🎉 Çekiliş Başladı!')
      .setDescription(`🎁 Ödül: **${odul}**\nKatılmak için aşağıdaki butona tıklayın!`)
      .setColor('Green')
      .setFooter({ text: `Süre: ${sure} saniye` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('katil')
        .setLabel('🎉 Katıl')
        .setStyle(ButtonStyle.Success)
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: sure * 1000 });

    collector.on('collect', i => {
      if (!entries.includes(i.user.id)) {
        entries.push(i.user.id);
        i.reply({ content: '✅ Çekilişe katıldın!', ephemeral: true });
      } else {
        i.reply({ content: '❗ Zaten katıldın!', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      if (entries.length === 0) {
        return interaction.editReply({
          content: '❌ Yeterli katılım olmadı, çekiliş iptal edildi.',
          components: [],
          embeds: []
        });
      }

      const winnerId = entries[Math.floor(Math.random() * entries.length)];
      const kazanan = `<@${winnerId}>`;

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎉 Çekiliş Sona Erdi!')
        .setDescription(`🎁 Ödül: **${odul}**\n🏆 Kazanan: ${kazanan}`)
        .setColor('Blue')
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed], components: [] });
    });
  }
};
