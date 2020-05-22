const Discord = require('discord.js');
const fs = require('fs');

const music = require('./music.json');
const songs = require('./music.js')
const embed = require('./embed.js');
const config = require('./config.json');
const { prefix } = require('./config.json');

let dembd = new Discord.MessageEmbed()
    .setDescription('**No Songs Playing Now**')
    .setImage('https://i.imgur.com/nadnyn5.jpg')
    .setFooter(`Do ${prefix}play <songname> to request songs.`);
var timer = {};
var tick = {};

async function refreshDisplay(msg, queue){
    if(music.mode[msg.guild.id] != "display" && music.mode[msg.guild.id] != "console") return;
    if(!tick[msg.guild.id]) tick[msg.guild.id] = {};
    tick[msg.guild.id][queue.no[msg.guild.id] - 1] = false;
    updateQueue(msg, queue);
    if(!queue[msg.guild.id] || !queue[msg.guild.id].songs || queue[msg.guild.id].songs.length === 0) return clearDisplay(msg);
    updateDisplay(msg, queue);
}

async function updateDisplay(msg, queue){
    let chnl = await msg.guild.channels.cache.find(v => v.name === config.display);
    timer[msg.guild.id] = 0;
    let mg = await chnl.messages.cache.get(music.id[msg.guild.id].msg2);
    tick[msg.guild.id][queue.no[msg.guild.id]] = true;
    const song = queue[msg.guild.id].songs[0];
    updateTimer(mg, song, queue.no[msg.guild.id]);
    let pembed = new Discord.MessageEmbed()
    .setDescription(`[${song.title}](${song.url})`)
    .setColor('#f8fc03')
    .setFooter(song.req, song.reqimg);
    await pembed.setImage(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
    let emsg = await chnl.messages.cache.get(music.id[msg.guild.id].msg1);
    emsg.edit(pembed).catch(console.error);
}

async function resetDisplay(msg, queue){
    let chnl = msg.guild.channels.cache.find(v => v.name === config.display);
    if(!chnl){
        chnl = await msg.guild.channels.create(config.display, {type: 'text'}).catch(console.error);
    }
    chnl.bulkDelete(await chnl.messages.fetch())
    .then(msgs => {
        music.id[msg.guild.id] = {};
        fs.writeFile("./music.json", JSON.stringify(music, null, 2), (err) => {
            if(err) console.error(err);
        });
        chnl.send(dembd).then(m1 => {
            music.id[msg.guild.id].msg1 = m1.id;
            fs.writeFile("./music.json", JSON.stringify(music, null, 2), (err) => {
                if(err) console.error(err);
                reactionManager(m1);
                chnl.send(`Song:  **●-------------------** \`00:00:00\``).then(m2 => {
                    music.id[msg.guild.id].msg2 = m2.id;
                    fs.writeFile("./music.json", JSON.stringify(music, null, 2), (err) => {
                        if(err) console.error(err);
                        chnl.send(`**__Queue List__**`).then(m3 => {
                            music.id[msg.guild.id].msg3 = m3.id;
                            fs.writeFile("./music.json", JSON.stringify(music, null, 2), (err) => {
                                if(err) console.error(err);
                                refreshDisplay(msg, queue);
                            });
                        });
                    });
                });
            });
        });
    });
}

async function clearDisplay(msg){
    let chnl = await msg.guild.channels.cache.find(v => v.name === config.display);
    let msg1 = await chnl.messages.fetch(music.id[msg.guild.id].msg1);
    let msg2 = await chnl.messages.fetch(music.id[msg.guild.id].msg2);
    await msg1.edit(dembd);
    await msg2.edit('Song:  **●-------------------** \`00:00:00\`');
}

async function updateTimer(mg, song, no){
    if(mg.guild.voice.connection && mg.guild.voice.connection.dispatcher && mg.guild.voice.connection.dispatcher.paused){
        return setTimeout(updateTimer, 100, mg, song, no)
    }
    else if(timer[mg.guild.id] > 19) return clearDisplay(mg);
    else if(tick[mg.guild.id][no]){
        timer[mg.guild.id] = timer[mg.guild.id] + 1;
        let m = 'Song: **' + "-".repeat(timer[mg.guild.id] - 1) + "●" + 
            "-".repeat(20 - timer[mg.guild.id]) + 
            `** \`${song.timestamp}\``;
        await mg.edit(m);
        setTimeout(updateTimer, song.secs*50, mg, song, no);
    }
    else return;
}

async function updateQueue(msg, queue){
    let chnl = await msg.guild.channels.cache.find(v => v.name === config.display);
  let c = '';
    if(!chnl) return;
    if(queue[msg.guild.id].loop && msg.guild.voice.connection && msg.guild.voice.connection.dispatcher && msg.guild.voice.connection.dispatcher.paused){
        c = '**__Queue List__** [Looping] [Paused]';
    }
    else if(queue[msg.guild.id].loop) c = '**__Queue List__** [Looping]';
    else if(msg.guild.voice.connection && msg.guild.voice.connection.dispatcher && msg.guild.voice.connection.dispatcher.paused){
        c = '**__Queue List__** [Paused]';
    }
    else c = '**__Queue List__**';
    let sngs = queue[msg.guild.id].songs;
    let i = 1;
    if(sngs){
        while(i < sngs.length){
            c = c + `\n[${i}] ${sngs[i].title}`;
            i = i + 1;
        }
    }
    let msg3 = await chnl.messages.cache.get(music.id[msg.guild.id].msg3);
    await msg3.edit(c);
}

async function reactionManager(msg){
    msg.react('⏯️');
    msg.react('⏩');
    msg.react('⏹️');
    msg.react('🔄');
    msg.react('🔀');
    const filter = (reaction, user) => user.id != config.id && !user.bot;
    const collector = msg.createReactionCollector(filter);
    collector.on('collect', async (r, u) => {
        r.users.remove(u);
        if(r.emoji.name === '⏯️'){
            if(msg.guild.voice && msg.guild.voice.connection && !msg.guild.voice.connection.dispatcher.paused){
                return songs.pause(songs.queue[msg.guild.id].msg)
            }
            else if(msg.guild.voice && msg.guild.voice.connection && msg.guild.voice.connection.dispatcher.paused){
                return songs.resume(songs.queue[msg.guild.id].msg)
            }
        }
        else if(r.emoji.name === '⏩'){
            if(!songs.queue[msg.guild.id].songs) return;
            return songs.skip(songs.queue[msg.guild.id].msg);
        }
        else if(r.emoji.name === '⏹️'){
            if(!songs.queue[msg.guild.id].songs) return;
            if(songs.queue[msg.guild.id].loop){
                songs.queue[msg.guild.id].loop = false;
            }
            songs.queue[msg.guild.id].songs = Array(songs.queue[msg.guild.id].songs[0]);
            return songs.end(songs.queue[msg.guild.id].msg);
        }
        else if(r.emoji.name === '🔄'){
            if(!songs.queue[msg.guild.id].songs) return;
            return songs.loop(songs.queue[msg.guild.id].msg);
        }
        else if(r.emoji.name === '🔀'){
            if(!songs.queue[msg.guild.id].songs) return;
            return songs.shuffle(songs.queue[msg.guild.id].msg);
        }
    });
}

module.exports.refreshDisplay = refreshDisplay;
module.exports.resetDisplay = resetDisplay;
module.exports.clearDisplay = clearDisplay;
module.exports.updateQueue = updateQueue;