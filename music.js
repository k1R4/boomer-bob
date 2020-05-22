const ytdl = require('ytdl-core-discord');
const yts = require('yt-search');
const genius = require("genius-lyrics");
const Discord = require('discord.js');

const config = require('./config.json');
const Genius = new genius.Client(config.genius);
const embed = require('./embed.js')
const { prefix } = require('./config.json');
const display = require('./display.js');
const music = require('./music.json');

var queue = {};
queue.no = {};
const modes = ['display', 'legacy'];
const dmodes = ['display', 'console'];

async function join(msg){
    queue[msg.guild.id] = {};
    queue[msg.guild.id].songs = [];
    queue[msg.guild.id].history = [];
    queue[msg.guild.id].loop = false;
    const connection = await msg.member.voice.channel.join().catch(err => console.log);
    queue[msg.guild.id].connection = connection;
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, `Joined ${msg.guild.voice.channel.name}!`);
}


async function leave(msg){
    queue[msg.guild.id] = {};
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, `Disconnected from ${msg.guild.voice.channel.name}. Thanks for giving my throat a break.`);
    await msg.guild.voice.connection.disconnect();
}

async function add(msg){
  let key = '';
    if(msg.content.startsWith(`${prefix}play`)) key = msg.content.slice(prefix.length + 4);
    else if(msg.content.startsWith(`${prefix}add`)) key = msg.content.slice(prefix.length + 3);
    else key = msg.content.slice(prefix.length + 1);
    if(!key) return embed.error(msg.channel, 'Hold up. First gimme a song to play kid');
    yts(key, async (err, r) => {
        await new Promise(resolve => setTimeout(resolve, 75));
        if(err) return embed.error(msg.channel, `Error occured: \`${err}\``);
        const video = r.videos[0];
        qmanager(msg, video);
    });
}

async function execute(msg){
    if(queue[msg.guild.id].songs.length === 0){
        return leave(msg);
    }
    if(modes.includes(music.mode[msg.guild.id])){
        embed.constructor(msg.channel, '**Now Playing**',
                        `[${queue[msg.guild.id].songs[0].title}](${queue[msg.guild.id].songs[0].url})`, 
                        '#f8fc03', `${queue[msg.guild.id].songs[0].req}`,
                        `https://img.youtube.com/vi/${queue[msg.guild.id].songs[0].id}/mqdefault.jpg`,
                        queue[msg.guild.id].songs[0].reqimg);
    }
    const dispacther = queue[msg.guild.id].connection.play(await ytdl(queue[msg.guild.id].songs[0].url, {format: 'audioonly', highWaterMark: 1<<25}), {type: 'opus'});
    dispacther.setBitrate(96);
    dispacther.setVolume(0.4);
    dispacther.on('finish', () => {
        end(msg);
    })
}

async function skip(msg){
    await msg.guild.voice.connection.dispatcher.destroy();
    end(msg);
}

async function pause(msg){
    if(msg.guild.voice.connection.dispatcher.paused) return embed.error(msg.channel, 'One step ahead of you. Already paused.');
    msg.guild.voice.connection.dispatcher.pause();
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, 'Paused!');
    if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
}

async function resume(msg){
    if(!msg.guild.voice.connection.dispatcher.paused) return embed.error(msg.channel, 'My throat hurts. I am not paused.');
    msg.guild.voice.connection.dispatcher.resume();
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, 'Resumed!');
    if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
}

async function end(msg){
    let shifted = await queue[msg.guild.id].songs.shift();
    await queue[msg.guild.id].history.push(shifted);
    if(queue[msg.guild.id].history.length > 15) await queue[msg.guild.id].history.shift();
    if(queue[msg.guild.id].loop) await queue[msg.guild.id].songs.push(shifted);
    if(!queue.no[msg.guild.id]) queue.no[msg.guild.id] = 0;
    queue.no[msg.guild.id] = queue.no[msg.guild.id] + 1;
    if(dmodes.includes(music.mode[msg.guild.id])) display.refreshDisplay(msg, queue);
    execute(msg);
}

async function loop(msg){
    if(queue[msg.guild.id].loop){
        queue[msg.guild.id].loop = false;
        if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, 'Looping disabled!');
    }
    else{
        queue[msg.guild.id].loop = true;
        if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, 'Looping enbaled!');
    }
    if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
}

async function remove(msg){
    let key = msg.content.slice(prefix.length + 6);
    if(!key || isNaN(key) || key <= 0 || key >= queue[msg.guild.id].songs.length) return embed.error(msg.channel, 'Specify a valid number kiddo.');
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, `Removed **${queue[msg.guild.id].songs[Number(key)].title}** from queue.`)
    await queue[msg.guild.id].songs.splice(Number(key), 1);
    if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
}

async function jump(msg){
    let key = msg.content.slice(prefix.length + 4);
    if(!key || isNaN(key) || key <= 0 || key >= queue[msg.guild.id].songs.length) return embed.error(msg.channel, 'Specify a valid number kiddo.');
    queue[msg.guild.id].songs.splice(0, Number(key) - 1);
    end(msg);
}

async function shuffle(msg){
    let first = queue[msg.guild.id].songs.shift();
    
    var currentIndex = queue[msg.guild.id].songs.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = queue[msg.guild.id].songs[currentIndex];
        queue[msg.guild.id].songs[currentIndex] = queue[msg.guild.id].songs[randomIndex];
        queue[msg.guild.id].songs[randomIndex] = temporaryValue;
    }

    queue[msg.guild.id].songs.unshift(first);
    if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, `Queue has been shuffled!`);
    if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
}

async function qmanager(msg, video){
    const song = {
        title: video.title,
        id: video.videoId,
        timestamp: video.timestamp,
        secs: video.seconds,
        url: video.url,
        req: msg.member.displayName,
        reqimg: msg.author.avatarURL(),
        key: msg.content
    };
    if(!queue[msg.guild.id] || !queue[msg.guild.id].songs){
        await join(msg);
        await queue[msg.guild.id].songs.push(song);
        queue[msg.guild.id].msg = msg;
        queue.no[msg.guild.id] = 1;
        if(dmodes.includes(music.mode[msg.guild.id])) display.resetDisplay(msg, queue);
        execute(msg);
    }
    else{
        if(modes.includes(music.mode[msg.guild.id])) embed.success(msg.channel, `Added **${song.title}** to the queue.`)
        await queue[msg.guild.id].songs.push(song);
        if(dmodes.includes(music.mode[msg.guild.id])) display.updateQueue(msg, queue);
    }
}

async function search(msg){
    if(msg.channel.name === config.display) return;
    let key = msg.content.slice(prefix.length + 6);
    if(!key) return msg.channel.send('What do I search? Nothing?');
    yts(key, async (err, r) => {
        await new Promise(resolve => setTimeout(resolve, 75));
        let i = 0;
        let m = ''
        while(i < 5){
            if(!r.videos[i]) return i = 5;
            m = m + `[${i+1}] ${r.videos[i].title}\n`
            i = i + 1;
        }
        embed.constructor(msg.channel, '**Top 5 results**', m, '#f8fc03', false, false, false);
        const filter = m => !isNaN(m.content) && 0 < m.content < 6 && m.member.id === msg.member.id;
        const collector = msg.channel.createMessageCollector(filter, {time: 15000, max: 1});
        
        collector.on('collect', n => {
            let video = r.videos[Number(n.content) - 1];
            qmanager(msg, video);
        });
    });
}

async function lyrics(msg){
    if(msg.channel.name === config.display) return;
    let key = msg.content.slice(prefix.length + 6);
    if(!key && (!queue[msg.guild.id] || !queue[msg.guild.id].songs)) return embed.error(msg.channel, 'Lyrics of what? Wanna hear disco music instead?');
    if(!key) key = queue[msg.guild.id].songs[0].key;
    let args  = key.split(" ")
    const search = await Genius.findTrack(key);
    
    let title = search.response.hits[0].result.title;
    if(!search.response.hits) return embed.error(msg.channel, `I have looked through the entire lyrics dictionary. No sign of those lyrics.`);
    msg.channel.startTyping();
    let lyricJSON = await Genius.getLyrics(search.response.hits[0].result.url);
    let lyric = lyricJSON.lyrics;
    if(lyric.length > 2048) lyric = lyric.slice(0, 2044) + '...';
    let embd = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(lyric)
    .setColor('#f8fc03');
    await msg.channel.send(embd)
    .then(async m => {
        msg.channel.stopTyping();
        await m.react('❌');
        const filter = (reaction, user) => reaction.emoji.name === '❌' && user.id != config.id;
        const collector = m.createReactionCollector(filter, {time: 15000});
        collector.on('collect', r => m.delete());
    })
}

module.exports.join = join;
module.exports.leave = leave;
module.exports.add = add;
module.exports.skip = skip;
module.exports.pause = pause;
module.exports.resume = resume;
module.exports.loop = loop;
module.exports.remove = remove;
module.exports.jump = jump;
module.exports.shuffle = shuffle;
module.exports.search = search;
module.exports.lyrics = lyrics;
module.exports.end = end;
module.exports.queue = queue;