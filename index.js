const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("PLAY BOY E-SPORTS ONLINE"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;

// FILAS
let filas = {
  "x1-mobile": [],
  "x2-mobile": [],
  "x3-mobile": [],
  "x4-mobile": [],
  "full-soco-mobile": [],
  "x1-emulador": [],
  "x2-emulador": [],
  "x3-emulador": [],
  "x4-emulador": [],
  "full-soco-emulador": []
};

let canaisPrivados = {};
let painelMsg = null;

client.once("ready", () => {
  console.log("👑 PLAY BOY E-SPORTS ONLINE");
});

// =====================
// COMANDO !setup
// =====================
client.on("messageCreate", async (message) => {
  if (!message.guild) return;

  if (message.content === "!setup") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
      return message.reply("❌ Você precisa ser administrador.");

    message.reply("⚙️ Criando estrutura da PLAY BOY E-SPORTS...");

    // CARGOS
    const cargos = ["DONO","🎖️ CEO","💼 DIRETOR","🛡️ GERENTE GERAL","📋 ADMIN GERAL","🧩 COORDENADOR","🔥 HEAD COMPETITIVO","📊 ANALISTA","📢 INFLUENCER","🎫 SUPORTE","👤 MEMBRO COMPETITIVO","🏆 MVP","🥇 TOP 1 RANK","⭐ DESTAQUE","👤 MEMBRO","🎟️ CLIENTE","👀 VISITANTE"];
    for (let nome of cargos) if (!message.guild.roles.cache.find(r => r.name===nome)) 
      await message.guild.roles.create({ name: nome, reason: "Setup PLAY BOY" });

    // CATEGORIAS E CANAIS
    const info = await message.guild.channels.create({ name: "📜 INFORMAÇÕES", type: ChannelType.GuildCategory });
    await message.guild.channels.create({ name: "📜・regras", type: ChannelType.GuildText, parent: info.id });
    await message.guild.channels.create({ name: "📢・avisos", type: ChannelType.GuildText, parent: info.id });

    // ABA DE ANÁLISE (canais de voz)
    const analise = await message.guild.channels.create({ name: "📊 ANÁLISE", type: ChannelType.GuildCategory });
    await message.guild.channels.create({ name: "📊-partidas", type: ChannelType.GuildVoice, parent: analise.id });
    await message.guild.channels.create({ name: "📊-jogadores", type: ChannelType.GuildVoice, parent: analise.id });

    const mobile = await message.guild.channels.create({ name: "🎮 FILAS MOBILE", type: ChannelType.GuildCategory });
    const modosMobile = ["⚔️・x1-mobile","👥・x2-mobile","🔥・x3-mobile","⚡・x4-mobile","👊・full-soco-mobile"];
    for (let canal of modosMobile) await message.guild.channels.create({ name: canal, type: ChannelType.GuildText, parent: mobile.id });

    const emu = await message.guild.channels.create({ name: "🖥️ FILAS EMULADOR", type: ChannelType.GuildCategory });
    const modosEmu = ["⚔️・x1-emulador","👥・x2-emulador","🔥・x3-emulador","⚡・x4-emulador","👊・full-soco-emulador"];
    for (let canal of modosEmu) await message.guild.channels.create({ name: canal, type: ChannelType.GuildText, parent: emu.id });

    const adminRole = message.guild.roles.cache.find(r => r.name==="📋 ADMIN GERAL");
    const categoriaAdmin = await message.guild.channels.create({ name:"👑 ADMINISTRAÇÃO", type:ChannelType.GuildCategory, permissionOverwrites:[
      {id:message.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
      {id:adminRole.id, allow:[PermissionsBitField.Flags.ViewChannel]}
    ]});
    await message.guild.channels.create({ name:"🔒・painel-admin", type:ChannelType.GuildText, parent:categoriaAdmin.id });

    // TICKET
    const ticketCat = await message.guild.channels.create({ name:"🎫 SUPORTE", type:ChannelType.GuildCategory });
    const suporteRole = message.guild.roles.cache.find(r => r.name==="🎫 SUPORTE");
    const ticketChannel = await message.guild.channels.create({ name:"🎫-tickets", type:ChannelType.GuildText, parent:ticketCat.id });
    const ticketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("abrir-ticket").setLabel("🎫 Abrir Ticket").setStyle(ButtonStyle.Primary)
    );
    ticketChannel.send({ content:"Clique no botão para abrir um ticket de suporte:", components:[ticketRow] });

    message.channel.send("✅ PLAY BOY E-SPORTS criada com sucesso 👑🔥");
  }

  // EXCLUIR TODOS OS CANAIS
  if (message.content === "!reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
      return message.reply("❌ Apenas ADM pode resetar o servidor.");

    message.reply("🗑️ Excluindo todos os canais criados pelo bot...");
    message.guild.channels.cache.forEach(c => {
      if(c.deletable) c.delete().catch(()=>{});
    });
    message.channel.send("✅ Todos os canais foram excluídos!");
  }

  // PAINEL AO VIVO
  if (message.content==="!painel") {
    const painelRow = new ActionRowBuilder().addComponents(
      ...Object.keys(filas).map(modo=>
        new ButtonBuilder()
          .setCustomId(modo)
          .setLabel(`${modo.toUpperCase()} | 0 jogadores`)
          .setStyle(ButtonStyle.Primary)
      ),
      new ButtonBuilder().setCustomId("sair").setLabel("🚪 SAIR").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ content:"👑 PLAY BOY E-SPORTS - Painel de filas ao vivo:", components:[painelRow] });
    painelMsg = msg;
  }
});

// =====================
// INTERAÇÃO DE BOTÕES
// =====================
client.on("interactionCreate", async (interaction)=>{
  if(!interaction.isButton()) return;
  const modo = interaction.customId;
  const userId = interaction.user.id;

  // SAIR
  if(modo==="sair"){
    for(let m in filas) filas[m]=filas[m].filter(id=>id!==userId);
    atualizarPainel();
    return interaction.reply({content:"✅ Você saiu de todas as filas.", ephemeral:true});
  }

  // TICKET
  if(modo==="abrir-ticket"){
    const ticketCat = interaction.guild.channels.cache.find(c=>c.name==="🎫 SUPORTE" && c.type===4);
    const ticketChannel = await interaction.guild.channels.create({ name:`🎫-ticket-${interaction.user.username}`, type:0, parent:ticketCat.id, permissionOverwrites:[
      {id:interaction.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.user.id, allow:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.guild.roles.cache.find(r=>r.name==="🎫 SUPORTE")?.id, allow:[PermissionsBitField.Flags.ViewChannel]}
    ]});
    ticketChannel.send(`Olá <@${interaction.user.id}>, aguarde que a equipe de suporte atenderá você.`);
    return interaction.reply({content:`✅ Ticket criado: <#${ticketChannel.id}>`, ephemeral:true});
  }

  // FECHAR CANAL
  if(modo==="fechar-canal"){
    const memberRoles = interaction.member.roles.cache.map(r=>r.name.toUpperCase());
    const staffRoles = ["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"];
    if(!memberRoles.some(r=>staffRoles.includes(r))) return interaction.reply({content:"❌ Apenas ADM ou superiores podem fechar este canal.", ephemeral:true});
    await interaction.channel.delete().catch(()=>{});
    return;
  }

  // ENTRAR NA FILA
  if(!filas[modo].includes(userId)) filas[modo].push(userId);
  else return interaction.reply({content:"⚠️ Você já está nessa fila.", ephemeral:true});

  await interaction.reply({content:`✅ Você entrou na fila ${modo.toUpperCase()}`, ephemeral:true});
  atualizarPainel();

  const limite = modo.includes("full-soco")?8:2;
  if(filas[modo].length>=limite){
    const guild = interaction.guild;
    const permissoes = [{id:guild.id, deny:[PermissionsBitField.Flags.ViewChannel]}];
    filas[modo].forEach(id=>permissoes.push({id, allow:[PermissionsBitField.Flags.ViewChannel]}));
    guild.roles.cache.forEach(role=>{ 
      if(["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"].includes(role.name.toUpperCase())) 
        permissoes.push({id:role.id, allow:[PermissionsBitField.Flags.ViewChannel]}) 
    });
    const canal = await guild.channels.create({ name:`⚔️-${modo}-${Date.now()}`, type:0, permissionOverwrites:permissoes });
    canaisPrivados[modo]=canal.id;

    const embed = new EmbedBuilder().setTitle("⚔️ PARTIDA INICIADA").setDescription(`Jogadores:\n${filas[modo].map(id=>`<@${id}>`).join("\n")}\n\nADM pode fechar clicando no botão abaixo.`).setColor("#D4AF37");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("fechar-canal").setLabel("🛑 FECHAR CANAL").setStyle(ButtonStyle.Danger)
    );
    canal.send({ embeds:[embed], components:[row] });
    filas[modo]=[];
  }
});

// =====================
// FUNÇÃO ATUALIZAR PAINEL AO VIVO
// =====================
async function atualizarPainel(){
  if(!painelMsg) return;
  const row = new ActionRowBuilder().addComponents(
    ...Object.keys(filas).map(modo=>{
      return new ButtonBuilder().setCustomId(modo).setLabel(`${modo.toUpperCase()} | ${filas[modo].length} jogadores`).setStyle(ButtonStyle.Primary);
    }),
    new ButtonBuilder().setCustomId("sair").setLabel("🚪 SAIR").setStyle(ButtonStyle.Danger)
  );
  await painelMsg.edit({ components:[row] });
}

client.login(TOKEN);
