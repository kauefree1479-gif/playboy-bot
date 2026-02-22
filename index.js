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

// Todos os preços que você mencionou
let precos = [0.30,0.50,0.70,1,2,3,5,10,20,30,50,70,100];

let canaisPrivados = {};
let painelMsg = {};
let senhas = {}; // Senhas das salas

// Cargos com acesso restrito
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

    // ======= CATEGORIAS =======
    const categorias = {
      "MOBILE":["x1-mobile","x2-mobile","x3-mobile","x4-mobile"],
      "EMULADOR":["x1-emulador","x2-emulador","x3-emulador","x4-emulador"]
    };

    for(const [catName, modos] of Object.entries(categorias)){
      // Criar categoria
      let cat = await message.guild.channels.create({name:`🎮 ${catName}`, type:ChannelType.GuildCategory});

      for(let modo of modos){
        // Criar canal de texto para fila
        let canal = await message.guild.channels.create({
          name:`⚔️-${modo}`, 
          type:ChannelType.GuildText, 
          parent:cat.id,
          permissionOverwrites:[
            {id:message.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]}, // Todos negado
            ...message.guild.roles.cache.filter(r => cargosRestritos.includes(r.name.toUpperCase()))
              .map(r => ({id:r.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]}))
          ]
        });
        
        // Painel com botões de preço
        const row = new ActionRowBuilder();
        precos.forEach(valor=>{
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`${modo}_preco_${valor}`)
              .setLabel(`R$${valor}`)
              .setStyle(ButtonStyle.Primary)
          );
        });

        // Enviar mensagem com botões
        try{
          let painel = await canal.send({content:`👑 FILA ${modo.toUpperCase()}\nEscolha seu preço:`, components:[row]});
          painelMsg[modo] = painel.id;
        }catch(e){
          console.log(`❌ Falha ao enviar painel na fila ${modo}:`, e);
        }
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
