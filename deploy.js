const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const nbx = require("noblox.js");
require("dotenv").config();

// Env'deki BRANSLAR'ı parse eden fonksiyon
function parseBranslarEnv() {
  const env = process.env.BRANSLAR || "";
  const choices = [];
  env.split(",").forEach(pair => {
    const [name, value] = pair.split(":").map(s => s && s.trim());
    if (name && value) {
      choices.push({ name: name, value: value });
    }
  });
  return choices;
}

async function deploy() {
  const groupId = Number(process.env.GROUPID);
  await nbx.setCookie(process.env.COOKIE);
  const roles = await nbx.getRoles(groupId);

  const rankChoices = roles
    .filter((role) => role.rank <= 32)
    .slice(0, 25)
    .map((role) => ({
      name: role.name.slice(0, 32),
      value: role.rank,
    }));

  const commands = [
    // 🔷 /rutbedegistir
    new SlashCommandBuilder()
      .setName("rutbedegistir")
      .setDescription("Bir kullanıcıya istediğin rütbeyi verir.")
      .addStringOption(option =>
        option.setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("sebep")
          .setDescription("Rütbe değişikliği sebebi")
          .setRequired(true)
      ),


    // 🔷 /bransrutbe
    new SlashCommandBuilder()
      .setName("bransrutbe")
      .setDescription("Bir kullanıcının seçilen branş grubundaki rütbesini değiştirir.")
      .addStringOption(option =>
        option
          .setName("username")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName("brans")
          .setDescription("Branş seçiniz")
          .setRequired(true)
          .addChoices(...parseBranslarEnv()) // Env'den dinamik al
      ),

    // 🔷 /gamepass
    new SlashCommandBuilder()
      .setName("gamepass")
      .setDescription("Bir Roblox kullanıcısının sahip olduğu gamepass'ları gösterir.")
      .addStringOption(option =>
        option
          .setName("username")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true)
      ),

    // 🔷 /promote
    new SlashCommandBuilder()
      .setName("promote")
      .setDescription("Bir kullanıcıyı terfi ettirir.")
      .addStringOption(option =>
        option
          .setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true),
      )
      .addStringOption(option =>
        option
          .setName("sebep")
          .setDescription("Sebep")
          .setRequired(false),
      ),

    // 🔷 /demote
    new SlashCommandBuilder()
      .setName("demote")
      .setDescription("Bir kullanıcıyı rütbe düşürür.")
      .addStringOption(option =>
        option
          .setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true),
      )
      .addStringOption(option =>
        option
          .setName("sebep")
          .setDescription("Sebep")
          .setRequired(false),
      ),

    // 🔷 /ban
    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Bir kullanıcıyı gruptan banlar.")
      .addStringOption(option =>
        option
          .setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true),
      )
      .addStringOption(option =>
        option
          .setName("sebep")
          .setDescription("Sebep")
          .setRequired(false),
      ),

    // 🔷 /gruplar
    new SlashCommandBuilder()
      .setName("gruplar")
      .setDescription("Bir Roblox kullanıcısının grup üyeliklerini listeler.")
      .addStringOption(option =>
        option
          .setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true),
      ),

    // 🔷 /rütbe
    new SlashCommandBuilder()
      .setName("rütbe")
      .setDescription("Bir Roblox kullanıcısının gruptaki rütbesini gösterir.")
      .addStringOption(option =>
        option
          .setName("kullanici")
          .setDescription("Roblox kullanıcı adı")
          .setRequired(true),
      ),

    // 🔷 /cekilis
    new SlashCommandBuilder()
      .setName("cekilis")
      .setDescription("Bir çekiliş başlatır.")
      .addStringOption(option =>
        option
          .setName("odul")
          .setDescription("Verilecek ödül (örnek: 1 Aylık Nitro)")
          .setRequired(true),
      )
      .addIntegerOption(option =>
        option
          .setName("sure")
          .setDescription("Çekiliş süresi (saniye)")
          .setRequired(true),
      ),

    // 🔷 /yardim
    new SlashCommandBuilder()
      .setName("yardim")
      .setDescription("Botun komutları hakkında yardım alırsınız."),

    // 🔷 /tamyasakla
    new SlashCommandBuilder()
      .setName("tamyasakla")
      .setDescription("Kullanıcıyı tüm sunuculardan yasaklar.")
      .addUserOption(option =>
        option
          .setName("kullanici")
          .setDescription("Yasaklanacak kullanıcı")
          .setRequired(true),
      )
      .addStringOption(option =>
        option
          .setName("sebep")
          .setDescription("Sebep")
          .setRequired(false),
      ),

    // 🔷 /tamyasaklakaldir
    new SlashCommandBuilder()
      .setName("tamyasaklakaldir")
      .setDescription("Kullanıcının tüm sunuculardaki yasağını kaldırır.")
      .addStringOption(option =>
        option
          .setName("kullaniciid")
          .setDescription("Yasağı kaldırılacak kullanıcının ID'si")
          .setRequired(true),
      )
      .addStringOption(option =>
        option
          .setName("sebep")
          .setDescription("Sebep")
          .setRequired(false),
      ),

    // 🔷 /aktiflik
    new SlashCommandBuilder()
      .setName("aktiflik")
      .setDescription("Oyundaki anlık oyuncu sayısını gösterir."),

    // 🔷 /duyuru
    new SlashCommandBuilder()
      .setName("duyuru")
      .setDescription("Belirlenmiş sunuculardaki duyuru kanallarına mesaj gönderir.")
      .addStringOption(option =>
        option
          .setName("mesaj")
          .setDescription("Gönderilecek duyuru mesajı")
          .setRequired(true),
      ),

  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("📤 Slash komutlar yükleniyor...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error("❌ Slash komut yükleme hatası:", error);
  }
}

deploy();

