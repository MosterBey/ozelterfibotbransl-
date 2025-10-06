require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const nbx = require('noblox.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();
client.tempBransUser = new Map(); // Branş ve kullanıcı geçici saklama

// Komutları yükle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[UYARI] Komut dosyası '${file}' eksik "data" veya "execute" içermiyor.`);
  }
}

client.once('ready', () => {
  console.log(`✅ Bot hazır: ${client.user.tag}`);
  client.user.setActivity('MosterDev', { type: 'WATCHING' });
});

// Roblox giriş
(async () => {
  try {
    if (!process.env.COOKIE) return console.warn('⚠️ ROBLOSECURITY cookie env bulunamadı.');
    await nbx.setCookie(process.env.COOKIE);
  } catch (err) {
    console.error('❌ Roblox giriş hatası:', err);
  }
})();

// Slash komutları ve select menu
client.on('interactionCreate', async interaction => {
  // Slash komut
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try { await command.execute(interaction, client); } 
    catch (err) { console.error(err); }
  }

  // Branş rütbe select menu
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('rankSelect_')) {
    const data = client.tempBransUser.get(interaction.user.id);
    if (!data) return interaction.update({ content: '❌ Kullanıcı veya branş bilgisi bulunamadı.', components: [] });

    try {
      // Bransrutbe.js içinde selectMenu fonksiyonunu çağır
      const command = client.commands.get('bransrutbe');
      if (command?.selectMenu) {
        await command.selectMenu(interaction, client);
      } else {
        await interaction.update({ content: '❌ İşlem yapılamıyor.', components: [] });
      }
    } catch (err) {
      console.error(err);
      await interaction.update({ content: `❌ Hata oluştu: ${err.message}`, components: [] });
    }
  }
});

if (!process.env.DISCORD_TOKEN) process.exit(1);
client.login(process.env.DISCORD_TOKEN);
