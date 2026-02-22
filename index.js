const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField, 
  EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const express = require("express");

// ====== SERVIDOR WEB (Railway precisa disso) ======
const app = express();
app.get("/", (req, res) => {
  res.send("👑 PLAY BOY E-SPORTS ONLINE");
});
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Servidor web ativo.");
});

// ====== CONFIG BOT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;

// ====== SISTEMA ======
let filas = {
  x1: [],
  x2: [],
  x3: [],
  x4: []
};

let ranking = {};
let blacklist = [];

// Criar arquivos se não existirem
if (!fs.existsSync('./ranking.json')) fs.writeFileSync('./ranking.json', '{}');
if (!fs.existsSync('./blacklist.json')) fs.writeFileSync('./blacklist.json', '[]');

ranking = JSON.parse(fs.readFileSync('./ranking.json'));
blacklist = JSON.parse(fs.readFileSync('./blacklist.json'));

// ====== CARGOS QUE VEEM TODOS CANAIS ======
const CARGOS_MASTER = ["DONO", "DIR", "GER"];

client.once('ready', () => {
  console.log("👑 PLAY BOY E-SPORTS ONLINE");
});

// ====== COMANDOS ======
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0].toLowerCase();

  if (blacklist.includes(message.author.id)) {
    return message.reply("🚫 Você está blacklistado da PLAY BOY E-SPORTS.");
  }

  // ====== ENTRAR FILA ======
  if (["!x1","!x2","!x3","!x4"].includes(cmd)) {

    const modo = cmd.replace("!", "");

    if (filas[modo].includes(message.author.id)) {
      return message.reply("⚠️ Você já está nessa fila.");
    }

    filas[modo].push(message.author.id);

    const embedFila = new EmbedBuilder()
      .setTitle("👑 PLAY BOY E-SPORTS")
      .setDescription(`${message.author} entrou na fila **${modo.toUpperCase()}**`)
      .setColor("#D4AF37");

    message.channel.send({ embeds: [embedFila] });

    if (filas[modo].length === 2) {

      const player1 = filas[modo][0];
      const player2 = filas[modo][1];

      const guild = message.guild;

      const permissoes = [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: player1,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: player2,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ];

      // DONO / DIR / GER veem todos
      guild.roles.cache.forEach(role => {
        if (CARGOS_MASTER.includes(role.name.toUpperCase())) {
          permissoes.push({
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          });
        }
      });

      const canal = await guild.channels.create({
        name: `⚔️-${modo}-${Date.now()}`,
        type: 0,
        permissionOverwrites: permissoes
      });

      const embedPartida = new EmbedBuilder()
        .setTitle("⚔️ PARTIDA INICIADA")
        .setDescription(`
👑 **PLAY BOY E-SPORTS**

Modo: **${modo.toUpperCase()}**

<@${player1}>  
🆚  
<@${player2}>

Após a partida use:
\`!win @usuario\`
        `)
        .setColor("#D4AF37");

      canal.send({ embeds: [embedPartida] });

      filas[modo] = [];
    }
  }

  // ====== REGISTRAR VITÓRIA ======
  if (cmd === "!win") {

    const winner = message.mentions.users.first();
    if (!winner) return message.reply("Marque o vencedor.");

    if (!ranking[winner.id]) ranking[winner.id] = 0;

    ranking[winner.id] += 1;

    fs.writeFileSync('./ranking.json', JSON.stringify(ranking, null, 2));

    const embedWin = new EmbedBuilder()
      .setTitle("🏆 VITÓRIA REGISTRADA")
      .setDescription(`${winner} ganhou +1 ponto!`)
      .setColor("#D4AF37");

    message.channel.send({ embeds: [embedWin] });
  }

  // ====== VER RANKING ======
  if (cmd === "!ranking") {

    let texto = "";

    Object.keys(ranking)
      .sort((a,b) => ranking[b] - ranking[a])
      .slice(0,10)
      .forEach((id, index) => {
        texto += `**${index+1}°** <@${id}> — ${ranking[id]} vitórias\n`;
      });

    if (!texto) texto = "Sem registros ainda.";

    const embedRanking = new EmbedBuilder()
      .setTitle("🏆 RANKING PLAY BOY E-SPORTS")
      .setDescription(texto)
      .setColor("#D4AF37");

    message.channel.send({ embeds: [embedRanking] });
  }

  // ====== BLACKLIST ======
  if (cmd === "!blacklist") {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Apenas administradores.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("Marque alguém.");

    if (!blacklist.includes(user.id)) {
      blacklist.push(user.id);
      fs.writeFileSync('./blacklist.json', JSON.stringify(blacklist, null, 2));
    }

    message.channel.send(`🚫 ${user} foi blacklistado.`);
  }
});

client.login(TOKEN);
