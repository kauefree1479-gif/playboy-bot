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
        
        // ======= BOTÕES DE PREÇOS (MÁX 5 POR LINHA) =======
        let rows = [];
        let tempRow = new ActionRowBuilder();
        precos.forEach((valor, index) => {
          tempRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`${modo}_preco_${valor}`)
              .setLabel(`R$${valor}`)
              .setStyle(ButtonStyle.Primary)
          );
          if ((index + 1) % 5 === 0) {
            rows.push(tempRow);
            tempRow = new ActionRowBuilder();
          }
        });
        if (tempRow.components.length > 0) rows.push(tempRow);

        // Envia painel de preços
        let painel = await canal.send({
          content: `👑 FILA ${modo.toUpperCase()}\nEscolha seu preço:`,
          components: rows
        });
        painelMsg[modo] = painel.id;

        // ======= BOTÕES DE AÇÃO: Full UMP, XM8, Normal, Sair =======
        const actionRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId(`${modo}_fullump`).setLabel("Full UMP").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${modo}_xm8`).setLabel("XM8").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${modo}_normal`).setLabel("Normal").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${modo}_sair`).setLabel("Sair da Fila").setStyle(ButtonStyle.Danger)
          );

        await canal.send({
          content: `🎯 Ações da fila ${modo.toUpperCase()}:`,
          components: [actionRow]
        });
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

  // ===================== BOTÕES DE PREÇO =====================
  if(interaction.customId.includes("_preco_")){
    const [modo,, valorStr] = interaction.customId.split("_");
    const valor = parseFloat(valorStr);
    if(!filas[modo]) filas[modo]=[];
    if(!filas[modo].includes(userId)) filas[modo].push(userId);

    const limite = modo.includes("x1") ? 2 : modo.includes("x2") ? 4 : modo.includes("x3") ? 6 : modo.includes("x4") ? 8 : 2;
    if(filas[modo].length >= limite){
      const guild = interaction.guild;
      const permissoes = [{id:guild.id, deny:[PermissionsBitField.Flags.ViewChannel]}];
      filas[modo].forEach(id=>permissoes.push({id, allow:[PermissionsBitField.Flags.ViewChannel]}));
      guild.roles.cache.forEach(role=>{
        if(cargosRestritos.includes(role.name.toUpperCase()))
          permissoes.push({id:role.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]});
      });

      const valorTotal = (valor*2 + 0.05).toFixed(2);
      const canalPriv = await guild.channels.create({
        name:`⚔️-${modo}-R$${valorTotal}`, 
        type:ChannelType.GuildText, 
        permissionOverwrites:permissoes
      });
      canaisPrivados[modo] = canalPriv.id;
      senhas[modo] = Math.floor(Math.random()*9000+1000);

      const embed = new EmbedBuilder()
        .setTitle("⚔️ PARTIDA INICIADA")
        .setDescription(
          `Jogadores:\n${filas[modo].map(id=>`<@${id}>`).join("\n")}\n\n`+
          `💰 Valor da partida: R$${valorTotal}\n`+
          `🔒 Senha da sala: ${senhas[modo]}\n\nClique no botão abaixo para aceitar a aposta.`
        )
        .setColor("#FFD700");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("aceitar-aposta").setLabel("✅ Aceitar Aposta").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("fechar-canal").setLabel("🛑 FECHAR CANAL").setStyle(ButtonStyle.Danger)
      );

      await canalPriv.send({embeds:[embed], components:[row]});
      filas[modo] = [];
    }

    await interaction.reply({content:`✅ Você escolheu R$${valor} na fila ${modo.toUpperCase()}`, ephemeral:true});
  }

  // ===================== BOTÕES DE AÇÃO =====================
  const modosKeys = Object.keys(filas);
  modosKeys.forEach(modo=>{
    if(interaction.customId === `${modo}_fullump`){
      filas[modo] = filas[modo] || [];
      if(!filas[modo].includes(userId)) filas[modo].push(userId);
      return interaction.reply({content:"✅ Você escolheu Full UMP!", ephemeral:true});
    }
    if(interaction.customId === `${modo}_xm8`){
      filas[modo] = filas[modo] || [];
      if(!filas[modo].includes(userId)) filas[modo].push(userId);
      return interaction.reply({content:"✅ Você escolheu XM8!", ephemeral:true});
    }
    if(interaction.customId === `${modo}_normal`){
      filas[modo] = filas[modo] || [];
      if(!filas[modo].includes(userId)) filas[modo].push(userId);
      return interaction.reply({content:"✅ Você escolheu Normal!", ephemeral:true});
    }
    if(interaction.customId === `${modo}_sair`){
      filas[modo] = filas[modo] || [];
      filas[modo] = filas[modo].filter(id => id !== userId);
      return interaction.reply({content:"❌ Você saiu da fila!", ephemeral:true});
    }
  });

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
