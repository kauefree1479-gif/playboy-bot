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
// FILAS E PREÇOS
// =====================
let filas = {
  "x1-mobile": [],
  "x2-mobile": [],
  "x3-mobile": [],
  "x4-mobile": [],
  "x1-emulador": [],
  "x2-emulador": [],
  "x3-emulador": [],
  "x4-emulador": []
};

let precos = [0.30,0.50,0.70,1,2,3,5,10,20,30,50,70,100];

let canaisPrivados = {};
let painelMsg = {};
let senhas = {}; // Senhas das salas

const cargosRestritos = ["DONO","ADMIN GERAL","GERENTE","SUPORTE","STAFF"];

client.once("ready", () => console.log("👑 PLAY BOY E-SPORTS ONLINE"));

// =====================
// COMANDO !setup
// =====================
client.on("messageCreate", async message => {
  if (!message.guild) return;

  if(message.content === "!setup"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Você precisa ser administrador.");

    message.reply("⚙️ Criando estrutura da PLAY BOY E-SPORTS...");

    // ======= CARGOS =======
    const cargos = ["DONO","🎖️ CEO","💼 DIRETOR","🛡️ GERENTE GERAL","📋 ADMIN GERAL","🧩 COORDENADOR","🔥 HEAD COMPETITIVO","📊 ANALISTA","📢 INFLUENCER","🎫 SUPORTE","👤 MEMBRO COMPETITIVO","🏆 MVP","🥇 TOP 1 RANK","⭐ DESTAQUE","👤 MEMBRO","🎟️ CLIENTE","👀 VISITANTE","STAFF"];
    for(let nome of cargos) 
      if(!message.guild.roles.cache.find(r => r.name===nome))
        await message.guild.roles.create({name:nome, reason:"Setup PLAY BOY"});

    // ======= CATEGORIAS E FILAS ABERTAS =======
    const categorias = {
      "MOBILE":["x1-mobile","x2-mobile","x3-mobile","x4-mobile"],
      "EMULADOR":["x1-emulador","x2-emulador","x3-emulador","x4-emulador"]
    };

    for(const [catName, modos] of Object.entries(categorias)){
      let cat;
      try{
        cat = await message.guild.channels.create({name:`🎮 ${catName}`, type:ChannelType.GuildCategory});
      }catch(e){ continue; }

      for(let modo of modos){
        let canal;
        try{
          // Canais de fila abertos para todos
          canal = await message.guild.channels.create({
            name:`⚔️-${modo}`, 
            type:ChannelType.GuildText, 
            parent:cat.id,
            permissionOverwrites:[
              {id:message.guild.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]},
              ...message.guild.roles.cache.filter(r => cargosRestritos.includes(r.name.toUpperCase()))
                .map(r => ({id:r.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]}))
            ]
          });
        }catch(e){ continue; }

        // ======= BOTÕES DE PREÇO + AÇÃO =======
        let rows = [];
        precos.forEach(valor => {
          const priceRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`${modo}_preco_${valor}_fullump`)
                .setLabel(`R$${valor} Full UMP`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`${modo}_preco_${valor}_xm8`)
                .setLabel(`R$${valor} XM8`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`${modo}_preco_${valor}_normal`)
                .setLabel(`R$${valor} Normal`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`${modo}_preco_${valor}_sair`)
                .setLabel(`R$${valor} Sair`)
                .setStyle(ButtonStyle.Danger)
            );
          rows.push(priceRow);
        });

        // Envia painel de preços e ações
        let painel = await canal.send({
          content: `👑 FILA ${modo.toUpperCase()}\nEscolha seu preço e ação:`,
          components: rows
        });
        painelMsg[modo] = painel.id;
      }
    }

    // ======= B.O ANÁLISE =======
    let analiseCat = await message.guild.channels.create({name:"📊 B.O ANÁLISE", type:ChannelType.GuildCategory});
    for(let i=0;i<=10;i++){
      await message.guild.channels.create({name:`📊-análise-${i}`, type:ChannelType.GuildVoice, parent:analiseCat.id});
      await message.guild.channels.create({name:`📊-jogadores-${i}`, type:ChannelType.GuildVoice, parent:analiseCat.id});
    }

    // ======= TICKETS =======
    let ticketCat = await message.guild.channels.create({name:"🎫 SUPORTE", type:ChannelType.GuildCategory});
    let ticketChannel = await message.guild.channels.create({name:"🎫-tickets", type:ChannelType.GuildText, parent:ticketCat.id});
    const ticketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("abrir-ticket").setLabel("🎫 Abrir Ticket").setStyle(ButtonStyle.Primary)
    );
    ticketChannel.send({content:"Clique no botão para abrir um ticket de suporte:", components:[ticketRow]});

    message.channel.send("✅ Estrutura completa criada com sucesso!");
  }

  if(message.content==="!reset"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Apenas ADM pode resetar.");
    message.reply("🗑️ Excluindo todos os canais...");
    message.guild.channels.cache.forEach(c=>{
      if(c.deletable) c.delete().catch(()=>{});
    });
  }
});

// =====================
// INTERAÇÃO DE BOTÕES
// =====================
client.on("interactionCreate", async interaction=>{
  if(!interaction.isButton()) return;
  const userId = interaction.user.id;

  // ===================== BOTÕES DE PREÇO + AÇÃO =====================
  if(interaction.customId.includes("_preco_")){
    const [modo,, valorStr, acao] = interaction.customId.split("_");
    const valor = parseFloat(valorStr);
    filas[modo] = filas[modo] || [];

    if(acao === "sair"){
      filas[modo] = filas[modo].filter(id => id !== userId);
      return interaction.reply({content:`❌ Você saiu da fila R$${valor}`, ephemeral:true});
    }

    if(!filas[modo].includes(userId)) filas[modo].push(userId);
    return interaction.reply({content:`✅ Você escolheu R$${valor} com ação ${acao.toUpperCase()}`, ephemeral:true});
  }

  // ===================== FECHAR CANAL =====================
  if(interaction.customId==="fechar-canal"){
    const memberRoles = interaction.member.roles.cache.map(r=>r.name.toUpperCase());
    if(!memberRoles.some(r=>cargosRestritos.includes(r))) return interaction.reply({content:"❌ Apenas ADM pode fechar.", ephemeral:true});
    await interaction.channel.delete().catch(()=>{});
  }

  // ===================== ACEITAR APOSTA =====================
  if(interaction.customId==="aceitar-aposta"){
    const admRoles = cargosRestritos;
    const adms = interaction.guild.members.cache.filter(m=>m.roles.cache.some(r=>admRoles.includes(r.name.toUpperCase())));
    const canalPriv = interaction.channel;
    const canalName = canalPriv.name.split("-")[1];
    const valor = canalPriv.name.split("R$")[1] || "N/A";
    const senha = senhas[canalName] || "N/A";

    const embedAdm = new EmbedBuilder()
      .setTitle("💰 Aposta Aceita")
      .setDescription(
        `👤 Jogador: <@${interaction.user.id}>\n`+
        `🎮 Fila: ${canalName}\n`+
        `💰 Valor da Aposta: R$${valor}\n`+
        `🔒 Senha: ${senha}\n`+
        `📅 Hora: ${new Date().toLocaleString()}`
      )
      .setColor("#FFD700");

    adms.forEach(adm=>adm.send({embeds:[embedAdm]}).catch(()=>{}));
    interaction.reply({content:"✅ Você aceitou a aposta! ADM notificado.", ephemeral:true});
  }

  // ===================== TICKETS =====================
  if(interaction.customId==="abrir-ticket"){
    const ticketCat = interaction.guild.channels.cache.find(c=>c.name==="🎫 SUPORTE" && c.type===4);
    const ticketChannel = await interaction.guild.channels.create({
      name:`🎫-ticket-${interaction.user.username}`,
      type:0,
      parent:ticketCat.id,
      permissionOverwrites:[
        {id:interaction.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
        {id:interaction.user.id, allow:[PermissionsBitField.Flags.ViewChannel]},
        {id:interaction.guild.roles.cache.find(r=>r.name==="SUPORTE")?.id, allow:[PermissionsBitField.Flags.ViewChannel]}
      ]
    });
    ticketChannel.send(`Olá <@${interaction.user.id}>, aguarde que a equipe de suporte atenderá você.`);
    return interaction.reply({content:`✅ Ticket criado: <#${ticketChannel.id}>`, ephemeral:true});
  }
});

client.login(TOKEN);
