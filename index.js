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
  "x4-emulador": [],
  "rmv": []
};

// Todos os preços que você mencionou
let precos = [0.30,0.50,0.70,1,2,3,5,10,20,30,50,70,100];

let canaisPrivados = {};
let painelMsg = {};
let senhas = {}; // Senhas das salas

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
    const cargos = ["DONO","🎖️ CEO","💼 DIRETOR","🛡️ GERENTE GERAL","📋 ADMIN GERAL","🧩 COORDENADOR","🔥 HEAD COMPETITIVO","📊 ANALISTA","📢 INFLUENCER","🎫 SUPORTE","👤 MEMBRO COMPETITIVO","🏆 MVP","🥇 TOP 1 RANK","⭐ DESTAQUE","👤 MEMBRO","🎟️ CLIENTE","👀 VISITANTE"];
    for(let nome of cargos) 
      if(!message.guild.roles.cache.find(r => r.name===nome))
        await message.guild.roles.create({name:nome, reason:"Setup PLAY BOY"});

    // ======= CATEGORIAS =======
    const categorias = ["MOBILE","EMULADOR","MISTA","RMV"];
    const modos = {
      "MOBILE":["x1-mobile","x2-mobile","x3-mobile","x4-mobile"],
      "EMULADOR":["x1-emulador","x2-emulador","x3-emulador","x4-emulador"],
      "MISTA":["x1-mista","x2-mista","x3-mista","x4-mista"],
      "RMV":["rmv"]
    };

    for(let catName of categorias){
      const cat = await message.guild.channels.create({name:`🎮 ${catName}`, type:ChannelType.GuildCategory});
      for(let modo of modos[catName]){
        const canal = await message.guild.channels.create({name:`⚔️-${modo}`, type:ChannelType.GuildText, parent:cat.id});
        
        // Painel com botões para cada preço
        const row = new ActionRowBuilder();
        precos.forEach(valor=>{
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`${modo}_preco_${valor}`)
              .setLabel(`R$${valor}`)
              .setStyle(ButtonStyle.Primary)
          );
        });

        const painel = await canal.send({content:`👑 FILA ${modo.toUpperCase()}\nEscolha seu preço:`, components:[row]});
        painelMsg[modo] = painel.id;
      }
    }

    // ======= B.O ANÁLISE =======
    const analiseCat = await message.guild.channels.create({name:"📊 B.O ANÁLISE", type:ChannelType.GuildCategory});
    for(let i=0;i<=10;i++){
      await message.guild.channels.create({name:`📊-análise-${i}`, type:ChannelType.GuildVoice, parent:analiseCat.id});
      await message.guild.channels.create({name:`📊-jogadores-${i}`, type:ChannelType.GuildVoice, parent:analiseCat.id});
    }

    // ======= TICKETS =======
    const ticketCat = await message.guild.channels.create({ name:"🎫 SUPORTE", type:ChannelType.GuildCategory });
    const ticketChannel = await message.guild.channels.create({ name:"🎫-tickets", type:ChannelType.GuildText, parent:ticketCat.id });
    const ticketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("abrir-ticket").setLabel("🎫 Abrir Ticket").setStyle(ButtonStyle.Primary)
    );
    ticketChannel.send({content:"Clique no botão para abrir um ticket de suporte:", components:[ticketRow]});

    message.channel.send("✅ Estrutura completa da PLAY BOY E-SPORTS criada com sucesso!");
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

  // BOTÕES DE PREÇO
  if(interaction.customId.includes("_preco_")){
    const [modo,, valor] = interaction.customId.split("_");
    if(!filas[modo]) filas[modo]=[];
    if(!filas[modo].includes(userId)) filas[modo].push(userId);

    // Canal privado quando atingir limite
    const limite = modo.includes("x1") ? 2 : modo.includes("x2") ? 4 : modo.includes("x3") ? 6 : modo.includes("x4") ? 8 : 2;
    if(filas[modo].length>=limite){
      const guild = interaction.guild;
      const permissoes = [{id:guild.id, deny:[PermissionsBitField.Flags.ViewChannel]}];
      filas[modo].forEach(id=>permissoes.push({id, allow:[PermissionsBitField.Flags.ViewChannel]}));
      guild.roles.cache.forEach(role=>{
        if(["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"].includes(role.name.toUpperCase()))
          permissoes.push({id:role.id, allow:[PermissionsBitField.Flags.ViewChannel]});
      });

      const canalPriv = await guild.channels.create({name:`⚔️-${modo}-privado-${Date.now()}`, type:0, permissionOverwrites:permissoes});
      canaisPrivados[modo] = canalPriv.id;

      const embed = new EmbedBuilder()
        .setTitle("⚔️ PARTIDA INICIADA")
        .setDescription(
          `Jogadores:\n${filas[modo].map(id=>`<@${id}>`).join("\n")}\n\n`+
          `💰 Valor da partida: ${valor}\n`+
          `🔒 Senha da sala: ${senhas[modo] || "N/A"}\n\n`+
          `Clique no botão abaixo para aceitar a aposta.`
        )
        .setColor("#FFD700");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("aceitar-aposta").setLabel("✅ Aceitar Aposta").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("fechar-canal").setLabel("🛑 FECHAR CANAL").setStyle(ButtonStyle.Danger)
      );

      canalPriv.send({embeds:[embed], components:[row]});
      filas[modo] = [];
    }

    await interaction.reply({content:`✅ Você escolheu R$${valor} na fila ${modo.toUpperCase()}`, ephemeral:true});
  }

  // FECHAR CANAL
  if(interaction.customId==="fechar-canal"){
    const memberRoles = interaction.member.roles.cache.map(r=>r.name.toUpperCase());
    const staffRoles = ["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"];
    if(!memberRoles.some(r=>staffRoles.includes(r))) return interaction.reply({content:"❌ Apenas ADM pode fechar.", ephemeral:true});
    await interaction.channel.delete().catch(()=>{});
  }

  // ACEITAR APOSTA
  if(interaction.customId==="aceitar-aposta"){
    const admRoles = ["DONO","DIRETOR","GERENTE GERAL","ADMIN GERAL"];
    const adms = interaction.guild.members.cache.filter(m=>m.roles.cache.some(r=>admRoles.includes(r.name.toUpperCase())));

    const canalPriv = interaction.channel;
    const canalName = canalPriv.name.split("-")[1];
    const valor = "ver botão escolhido";
    const senha = senhas[canalName] || "N/A";

    const embedAdm = new EmbedBuilder()
      .setTitle("💰 Aposta Aceita")
      .setDescription(
        `👤 Jogador: <@${interaction.user.id}>\n`+
        `🎮 Fila: ${canalName}\n`+
        `💰 Valor da Aposta: ${valor}\n`+
        `🔒 Senha: ${senha}\n`+
        `📅 Hora: ${new Date().toLocaleString()}`
      )
      .setColor("#FFD700");

    adms.forEach(adm=>adm.send({embeds:[embedAdm]}).catch(()=>{}));
    interaction.reply({content:"✅ Você aceitou a aposta! ADM notificado.", ephemeral:true});
  }

  // ABRIR TICKET
  if(interaction.customId==="abrir-ticket"){
    const ticketCat = interaction.guild.channels.cache.find(c=>c.name==="🎫 SUPORTE" && c.type===4);
    const ticketChannel = await interaction.guild.channels.create({name:`🎫-ticket-${interaction.user.username}`, type:0, parent:ticketCat.id, permissionOverwrites:[
      {id:interaction.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.user.id, allow:[PermissionsBitField.Flags.ViewChannel]},
      {id:interaction.guild.roles.cache.find(r=>r.name==="🎫 SUPORTE")?.id, allow:[PermissionsBitField.Flags.ViewChannel]}
    ]});
    ticketChannel.send(`Olá <@${interaction.user.id}>, aguarde que a equipe de suporte atenderá você.`);
    return interaction.reply({content:`✅ Ticket criado: <#${ticketChannel.id}>`, ephemeral:true});
  }
});

client.login(TOKEN);
