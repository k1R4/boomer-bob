const { MessageEmbed } = require('discord.js');


async function error(chnl, err){
    //chnl.startTyping();
    let eembd = new MessageEmbed()
    .setColor('#fc0303')
    .setDescription(`🔴 ${err}`);

    await chnl.send(eembd);
    //chnl.stopTyping();
}

async function info(chnl, inf){
    //chnl.startTyping();
    let eembd = new MessageEmbed()
    .setColor('#348feb')
    .setDescription(`ℹ️ ${inf}`);

    await chnl.send(eembd);
    //chnl.stopTyping();
}

async function success(chnl, msg){
    //chnl.startTyping();
    var sembd = new MessageEmbed()
    .setColor('#03fc0f')
    .setDescription(`✅ ${msg}`);

    await chnl.send(sembd);
    //chnl.stopTyping();
}

async function constructor(chnl, title, desc, color, footer, thumbnail, footerimg){
    let cembd = new MessageEmbed();
    if(title) cembd.setTitle(title);
    if(desc) cembd.setDescription(desc);
    if(color) cembd.setColor(color);
    if(footer && footerimg) await cembd.setFooter(footer, footerimg);
    if(footer && !footerimg) cembd.setFooter(footer);
    if(thumbnail) await cembd.setThumbnail(thumbnail);

    await chnl.send(cembd);
}

module.exports.error = error;
module.exports.info = info;
module.exports.success = success;
module.exports.constructor = constructor;