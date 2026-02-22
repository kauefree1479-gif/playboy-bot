client.on("messageCreate", async message => {
  if (!message.guild) return;
  if(message.content !== "!setup") return;
  
  if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return message.reply("❌ Você precisa ser administrador.");

  message.reply("⚙️ Criando estrutura da PLAY BOY E-SPORTS...");

  const cargos = ["DONO","ADMIN GERAL","GERENTE","SUPORTE","STAFF"];
  for(let nome of cargos) {
    if(!message.guild.roles.cache.find(r => r.name===nome))
      try{ await message.guild.roles.create({name:nome, reason:"Setup PLAY BOY"}); }catch(e){ console.log(e); }
  }

  const categorias = {
    "MOBILE":["x1-mobile","x2-mobile","x3-mobile","x4-mobile"],
    "EMULADOR":["x1-emulador","x2-emulador","x3-emulador","x4-emulador"]
  };

  for(const [catName, modos] of Object.entries(categorias)){
    let cat;
    try{ cat = await message.guild.channels.create({name:`🎮 ${catName}`, type:ChannelType.GuildCategory}); }catch(e){ continue; }

    for(let modo of modos){
      let canal;
      try{
        canal = await message.guild.channels.create({
          name:`⚔️-${modo}`,
          type:ChannelType.GuildText,
          parent:cat.id,
          permissionOverwrites:[
            {id:message.guild.id, deny:[PermissionsBitField.Flags.ViewChannel]},
            ...message.guild.roles.cache.filter(r => cargos.includes(r.name.toUpperCase()))
              .map(r => ({id:r.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]}))
          ]
        });
      }catch(e){ continue; }

      // Botões de preços
      const rows = [];
      precos.forEach(valor=>{
        rows.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${modo}_preco_${valor}_fullump`).setLabel(`R$${valor} Full UMP`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`${modo}_preco_${valor}_xm8`).setLabel(`R$${valor} XM8`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`${modo}_preco_${valor}_normal`).setLabel(`R$${valor} Normal`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`${modo}_preco_${valor}_sair`).setLabel(`R$${valor} Sair`).setStyle(ButtonStyle.Danger)
          )
        );
      });

      try{ await canal.send({content:`👑 FILA ${modo.toUpperCase()}\nEscolha seu preço e ação:`, components:rows}); }catch(e){ console.log(e); }
    }
  }

  // Análise
  let analiseCat;
  try{ analiseCat = await message.guild.channels.create({name:"📊 B.O ANÁLISE", type:ChannelType.GuildCategory}); }catch(e){ console.log(e); }
  for(let i=0;i<=10;i++){
    try{ await message.guild.channels.create({name:`📊-análise-${i}`, type:ChannelType.GuildVoice, parent:analiseCat.id}); }catch(e){ continue; }
  }

  // Canal Pix
  let pixCat;
  try{ pixCat = await message.guild.channels.create({name:"💳 CADASTRO PIX", type:ChannelType.GuildCategory}); }catch(e){ console.log(e); }
  try{ await message.guild.channels.create({name:"💳-pix-adm", type:ChannelType.GuildText, parent:pixCat.id}); }catch(e){ console.log(e); }

  message.channel.send("✅ Estrutura completa criada com sucesso!");
});
