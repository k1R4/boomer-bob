const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');

const config = require('./config.json');
const { prefix } = require('./config.json');
const embed = require('./embed.js');
const music = require('./music.js');
const mjson = require('./music.json')

bot.on('ready', () => {
    console.log('Ready! Logged in as ' + bot.user.username);
    bot.user.setActivity(`the endgame | ${prefix}help`);
});

bot.on('message', async msg => {
    if(msg.channel.type === 'dm') return;
    if(!mjson.mode[msg.guild.id]){
        mjson.mode[msg.guild.id] = 'display';
        fs.writeFile("./music.json", JSON.stringify(mjson), (err) => {
            if(err) console.error(err);
        })
    }
    if(msg.channel.name === config.display && msg.author.id != config.id && mjson.mode[msg.guild.id] != 'console') return msg.delete();
    if(msg.author.bot) return;
    if(!msg.content.startsWith(prefix)) return;
    let args = msg.content.slice(prefix.length).split(" ");
    switch(args[0]){
        case 'ping':
            msg.channel.send('Pinging....')
            .then(async m => {
                await m.edit(`~~Pong~~ Boom! \`${Math.floor(m.createdTimestamp - msg.createdTimestamp)}ms\``);
            });
        break;
        case 'mode':
            if(!args[1]) return embed.info(msg.channel, `Current mode is ${mjson.mode[msg.guild.id]}`);
            if(args[1] != 'console' && args[1] != 'display' && args[1] != 'legacy'){
                return embed.error(msg.channel, 'Provide a valid mode name kid! `console`,`display`,`legacy`');
            }
            mjson.mode[msg.guild.id] = args[1];
            fs.writeFile("./music.json", JSON.stringify(mjson, null, 2), (err) => {
                if(err) console.error(err);
                embed.success(msg.channel, `Set music mode to \`${args[1]}\`!`);
            });
        break;
    }
    if(mjson.mode[msg.guild.id] === 'console' && msg.channel.name != config.display) return;
    if(msg.channel.name === config.display){
        msg.delete();
        musicHandler(args, msg);
    }
    else musicHandler(args, msg);
});

async function musicHandler(args, msg){
    switch(args[0]){
        case 'join':
            if(!msg.member.voice.channelID) return embed.error(msg.channel, 'Join a goddamn voice channel kid.');
            if(msg.guild.voice && msg.guild.voice.connection) return embed.error(msg.channel, `Can't you see that I am busy in ${msg.guild.voice.channel.name}`);
            music.join(msg);
        break;
        case 'leave':
        case 'stop':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            if(music.queue[msg.guild.id] && music.queue[msg.guild.id].songs){
                music.queue[msg.guild.id].songs = Array(music.queue[msg.guild.id].songs[0]);
                if(music.queue[msg.guild.id].loop){
                    music.queue[msg.guild.id].loop = false;
                }
                music.end(msg);
            }
            else music.leave(msg);
        break;
        case 'play':
        case 'add':
            if(!msg.member.voice || !msg.member.voice.channel) return embed.error(msg.channel, 'Join a goddamn voice channel kid');
            if(msg.guild.voice && msg.guild.voice.connection && msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, 'Join my voice channel before telling me what to do.');
            music.add(msg);
        break;
        case 'skip':
        case 'next':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.skip(msg);
        break;
        case 'pause':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.pause(msg);
        break;
        case 'resume':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.resume(msg);
        break; 
        case 'repeat':
        case 'loop':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.loop(msg);
        break;
        case 'remove':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.remove(msg);
        break;  
        case 'jump':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.jump(msg);
        break;
        case 'shuffle':
            if(!msg.guild.voice || !msg.guild.voice.connection) return embed.error(msg.channel, `I have already disconnected. Stay updated kid!`);
            if(msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, `Join my voice channel before telling me what to do.`);
            music.shuffle(msg);
        break;
        case 'search': 
            if(!msg.member.voice || !msg.member.voice.channel) return embed.error(msg.channel, 'Join a goddamn voice channel kid');
            if(msg.guild.voice && msg.guild.voice.connection && msg.guild.voice.channelID != msg.member.voice.channelID) return embed.error(msg.channel, 'Join my voice channel before telling me what to do.');
            music.search(msg);
        break;
        case 'lyrics':
            music.lyrics(msg);
        break;        
    }
}

bot.login(process.env.TOKEN);