const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("aktiflik")
    .setDescription("MPA oyunundaki aktif oyuncu sayısını gösterir."),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const universeId = process.env.UNIVERSEID;
      if (!universeId) {
        throw new Error("UNIVERSEID .env dosyasında tanımlı değil.");
      }

      const response = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${universeId}`
      );
      const data = await response.json();

      if (!data?.data || !data.data[0]) {
        throw new Error("Geçerli bir universeId girilmemiş olabilir.");
      }

      const info = data.data[0];

      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/games/thumbnails?universeIds=${universeId}&size=768x432&format=Png&isCircular=false`
      );
      const thumbData = await thumbRes.json();
      const thumbURL = thumbData?.data?.[0]?.imageUrl || null;

      const embed = new EmbedBuilder()
        .setTitle("🎮 MPA Aktiflik Bilgisi")
        .addFields(
          {
            name: "👥 Anlık Oyuncular",
            value: `${info.playing ?? 0}`,
            inline: true,
          },
          {
            name: "⭐ Favoriler",
            value: `${info.favoritedCount ?? 0}`,
            inline: true,
          },
          {
            name: "👣 Ziyaretler",
            value: `${info.visits ?? 0}`,
            inline: true,
          }
        )
        .setColor("Blue")
        .setTimestamp();

      if (thumbURL) embed.setThumbnail(thumbURL);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Aktiflik komutu hatası:", error);
      await interaction.editReply({
        content:
          "❌ Bir hata oluştu. Universe ID yanlış olabilir veya oyun gizli olabilir.",
      });
    }
  },
};
