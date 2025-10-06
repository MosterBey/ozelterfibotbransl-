const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamepass")
    .setDescription("Bir Roblox kullanıcısının sahip olduğu gamepass'ları gösterir.")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox kullanıcı adı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("username");
    await interaction.deferReply();

    try {
      // 1. Kullanıcı adından userId al
      const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      });
      const userData = await userRes.json();

      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("❌ Kullanıcı bulunamadı.");
      }

      const userId = userData.data[0].id;

      // 2. Kullanıcının sahip olduğu gamepass'ları al
      const res = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass?sortOrder=Asc&limit=100`);
      if (!res.ok) throw new Error("API hatası");
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        return interaction.editReply(`❌ **${username}** hiçbir gamepass'a sahip değil.`);
      }

      // Gamepass listesi (sadece ID gösteriyoruz, name için ayrıca bakmak lazım)
      const passes = data.data.map(item => `🎟️ Gamepass ID: ${item.id}`);
      const pageSize = 10;
      let currentPage = 0;

      const getPage = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return passes.slice(start, end).join("\n");
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️ Geri").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("next").setLabel("➡️ İleri").setStyle(ButtonStyle.Primary)
      );

      let message = await interaction.editReply({
        content: `✅ **${username}** kullanıcısının sahip olduğu gamepass'lar (Sayfa ${currentPage + 1}/${Math.ceil(passes.length / pageSize)}):\n\n${getPage(currentPage)}`,
        components: [row]
      });

      const collector = message.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "❌ Bu butonları sadece komutu kullanan kişi kullanabilir.", ephemeral: true });
        }

        if (i.customId === "prev" && currentPage > 0) currentPage--;
        else if (i.customId === "next" && (currentPage + 1) < Math.ceil(passes.length / pageSize)) currentPage++;

        await i.update({
          content: `✅ **${username}** kullanıcısının sahip olduğu gamepass'lar (Sayfa ${currentPage + 1}/${Math.ceil(passes.length / pageSize)}):\n\n${getPage(currentPage)}`,
          components: [row]
        });
      });

      collector.on("end", async () => {
        await message.edit({ components: [] });
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Gamepass bilgileri alınamadı.");
    }
  }
};
