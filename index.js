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

// =====================
// CONFIGURAÇÃO INICIAL
// =====================

// FILAS E PREÇOS INICIAIS
let filas = {
  "x1-mobile": [],
  "x2-mobile": [],
  "x3-mobile": [],
  "x4-mobile": [],
  "x1-emulador": [],
  "x2-emulador": [],
  "x3-emulador": [],
  "x4-emulador": [],
  "rmv": []
};

let precos = {
  "x1-mobile": 0.30,
  "x2-mobile": 0.50,
  "x3-mobile": 0.70,
  "x4-mobile": 1.00,
  "x1-emulador": 0.30,
  "x2-emulador": 0.50,
  "x3-emulador": 0.70,
  "x4-emulador": 1.00,
  "rmv": 0.30
};

let canaisPrivados = {};
let painelMsg = {};

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

    // ======= CRIAR CARGOS =======
    const cargos = ["DONO","🎖️ CEO","💼 DIRETOR","🛡️ GERENTE GERAL","📋 ADMIN GERAL","🧩 COORDENADOR","🔥 HEAD COMPETITIVO","📊 ANALISTA","📢 INFLUENCER","🎫 SUPORTE","👤 MEMBRO COMPETITIVO","🏆 MVP","🥇 TOP 1 RANK","⭐ DESTAQUE","👤 MEMBRO","🎟️ CLIENTE","👀 VISITANTE"];
    for (let nome of cargos) if (!message.guild.roles.cache.find(r => r.name===nome)) 
      await message.guild.roles.create({ name: nome, reason: "Setup PLAY BOY" });

    // ======= CRIAR FILAS E PAINÉIS =======
    for (let fila in filas){
      const categoria = await message.guild.channels.create({ name:`🎮 ${fila.toUpperCase()}`, type:ChannelType.GuildCategory });
      const canal = await message.guild.channels.create({ name:`⚔️-${fila}`, type:ChannelType.GuildText, parent:categoria.id });

      const painelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${fila}_entrar`).setLabel("Entrar").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${fila}_sair`).setLabel("Sair").setStyle(ButtonStyle.Danger)
      );

      const painel = await canal.send({ content:`👑 FILA ${fila.toUpperCase()}\n💰 PREÇO: ${precos[fila]}\n👤 Jogadores: 0/2`, components:[painelRow]});
      painelMsg[fila] = painel.id;
    }

    // ======= TICKET =======
    const ticketCat = await message.guild.channels.create({ name:"🎫 SUPORTE", type:ChannelType.GuildCategory });
    const ticketChannel = await message.guild.channels.create({ name:"🎫-tickets", type:ChannelType.GuildText, parent:ticketCat.id });
    const ticketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("abrir-ticket").setLabel("🎫 Abrir Ticket").setStyle(ButtonStyle.Primary)
    );
    ticketChannel.send({ content:"Clique no botão para abrir um ticket de suporte:", components:[ticketRow] });

    // ======= ANÁLISES =======
    const analise = await message.guild.channels.create({ name:"📊 ANÁLISE", type:ChannelType.GuildCategory });
    for(let i=1;i<=5;i++){
      await message.guild.channels.create({ name:`📊-partidas-${i}`, type:ChannelType.GuildVoice, parent:analise.id });
      await message.guild.channels.create({ name:`📊-jogadores-${i}`, type:ChannelType.GuildVoice, parent:analise.id });
    }

    message.channel.send("✅ PLAY BOY E-SPORTS criada com sucesso 👑🔥");
  }

  // ======= RESETAR SERVIDOR =======
  if(message.content==="!reset"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
      return message.reply("❌ Apenas ADM pode resetar o servidor.");
    message.reply("🗑️ Excluindo todos os canais...");
    message.guild.channels.cache.forEach(c=>{
      if(c.deletable) c.delete().catch(()=>{});
    });
  }

  // ======= ALTERAR PREÇO =======
  if(message.content.startsWith("!preco")){
    const args = message.content.split(" ");
    const canal = args[1];
    const novoPreco = parseFloat(args[2]);
    if(!precos[canal]) return message.reply("❌ Canal inválido.");
    precos[canal] = novoPreco;
    atualizarPainel(canal, message.guild);
    message.reply(`✅ Preço da fila ${canal} atualizado para ${novoPreco}`);
  }

  // ======= CRIAR SALA =======
  if(message.content.startsWith("!criar")){
    const args = message.content.split(" ");
    const canal = args[1]; 
    const senha = args[2];
    const valorBase = parseFloat(args[3]);
    if(!precos[canal]) return message.reply("❌ Canal inválido.");

    const valorFinal = (valorBase*2 + 0.05).toFixed(2);
    const c = message.guild.channels.cache.find(c=>c.name.includes(canal));
    if(c) await c.setName(`⚔️-${canal}-${valorFinal}`);
    precos[canal] = parseFloat(valorFinal);
    atualizarPainel(canal, message.guild);
    message.reply(`✅ Sala criada com senha ${senha} e valor final ${valorFinal}`);
  }
});

// =====================
// INTERAÇÃO DE BOTÕES
// =====================
client.on("interactionCreate", async (interaction)=>{
  if(!interaction.isButton()) return;
  const [canal, acao] = interaction.customId.split("_");
  const userId = interaction.user.id;

  // ======= ENTRAR NA FILA =======
  if(acao==="entrar"){
    if(!filas[canal].includes(userId)) filas[canal].push(userId);
    else return interaction.reply({content:"⚠️ Você já está nessa fila.", ephemeral:true});
    await interaction.reply({content:`✅ Você entrou na fila ${canal.toUpperCase()}`, ephemeral:true});
    atualizarPainel(canal, interaction.guild);

    // Checar limite
    const limite = canal.includes("x1") ? 2 : canal.includes("x2") ? 4 : canal.includes("x3") ? 6 : canal.includes("x4") ? 8 : 2;
    if(filas[canal].length>=limite){
      const guild = interaction.guild;
      const permissoes = [{id:guild.id, deny:[PermissionsBitField.Flags.ViewChannel]}];
      filas[canal].forEach(id=>permissoes.push({id, allow:[PermissionsBitField.Flags.ViewChannel]}));
      guild.roles.cache.forEach(role=>{ 
        if(["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"].includes(role.name.toUpperCase())) 
          permissoes.push({id:role.id, allow:[PermissionsBitField.Flags.ViewChannel]}) 
      });
      const canalPriv = await guild.channels.create({ name:`⚔️-${canal}-privado-${Date.now()}`, type:0, permissionOverwrites:permissoes });
      canaisPrivados[canal] = canalPriv.id;
      const embed = new EmbedBuilder().setTitle("⚔️ PARTIDA INICIADA").setDescription(`Jogadores:\n${filas[canal].map(id=>`<@${id}>`).join("\n")}\n\nADM pode fechar clicando no botão abaixo.`).setColor("#D4AF37");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("fechar-canal").setLabel("🛑 FECHAR CANAL").setStyle(ButtonStyle.Danger)
      );
      canalPriv.send({ embeds:[embed], components:[row] });
      filas[canal]=[];
      atualizarPainel(canal, interaction.guild);
    }
  }

  // ======= SAIR DA FILA =======
  if(acao==="sair"){
    filas[canal] = filas[canal].filter(id=>id!==userId);
    await interaction.reply({content:`✅ Você saiu da fila ${canal.toUpperCase()}`, ephemeral:true});
    atualizarPainel(canal, interaction.guild);
  }

  // ======= FECHAR CANAL =======
  if(interaction.customId==="fechar-canal"){
    const memberRoles = interaction.member.roles.cache.map(r=>r.name.toUpperCase());
    const staffRoles = ["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"];
    if(!memberRoles.some(r=>staffRoles.includes(r))) return interaction.reply({content:"❌ Apenas ADM ou superiores podem fechar este canal.", ephemeral:true});
    await interaction.channel.delete().catch(()=>{});
  }

  // ======= ABRIR TICKET =======
  if(interaction.customId==="abrir-ticket"){
    const ticketCat = interaction.guild.channels.cache.find(c=>c.name==="🎫 SUPORTE" && c.type===4);
    const ticketChannel = await interaction.guild.channels.create({ name:`🎫-ticket-${interaction.user.username}`, type:0, parent:ticketCat.id, permissionOverwrites:[
      {id:interaction.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.user.id, allow:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.guild.roles.cache.find(r=>r.name==="🎫 SUPORTE")?.id, allow:[PermissionsBitField.Flags.ViewChannel]}
    ]});
    ticketChannel.send(`Olá <@${interaction.user.id}>, aguarde que a equipe de suporte atenderá você.`);
    return interaction.reply({content:`✅ Ticket criado: <#${ticketChannel.id}>`, ephemeral:true});
  }
});

// =====================
// FUNÇÃO ATUALIZAR PAINEL
// =====================
async function atualizarPainel(canal, guild){
  try{
    const painelId = painelMsg[canal];
    if(!painelId) return;
    const c = guild.channels.cache.find(ch=>ch.name.includes(canal) && ch.type===0);
    if(!c) return;
    const msg = await c.messages.fetch(painelId);
    if(!msg) return;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${canal}_entrar`).setLabel("Entrar").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`${canal}_sair`).setLabel("Sair").setStyle(ButtonStyle.Danger)
    );
    await msg.edit({ content:`👑 FILA ${canal.toUpperCase()}\n💰 PREÇO: ${precos[canal]}\n👤 Jogadores: ${filas[canal].length}/${canal.includes("x1") ? 2 : canal.includes("x2") ? 4 : canal.includes("x3") ? 6 : canal.includes("x4") ? 8 : 2}`, components:[row] });
  }catch(e){}
}

client.login(TOKEN);
