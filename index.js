const { Telegraf } = require('telegraf');
require('dotenv').config();

const express = require('express');
const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);

app.listen(process.env.PORT || 5000);

var TIMEOUT_MILLISECONDS = 60000;
var TIMEOUT_SECONDS = 60;
var postsStack = [];

var allMediaPosts = [];
var TO_CHANNEL = -1001527376572;

bot.start((ctx) => {
    ctx.reply('Hi !! Welcome To Self Destruction Bot \nOfficial bot of @temp_demo');
});

bot.command('set_timeout', (ctx) => {
    const newTimeOut = ctx.message.text.split('/set_timeout ');
    const seconds = newTimeOut[1];
    TIMEOUT_SECONDS = seconds;
    const FinalTimeOut = secondsToHms(seconds);
    TIMEOUT_MILLISECONDS = seconds * 1000;
    ctx.reply(`Your Timeout Is Set To ${FinalTimeOut}`);
});

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second " : " seconds ") : "";

    if (hDisplay && mDisplay && sDisplay) return hDisplay + ', ' + mDisplay + ', ' + sDisplay;
    if (hDisplay && mDisplay) return hDisplay + ', ' + mDisplay;
    if (hDisplay && sDisplay) return hDisplay + ', ' + sDisplay
    if (mDisplay && sDisplay) return mDisplay + ', ' + sDisplay;
    if (hDisplay) return hDisplay;
    if (mDisplay) return mDisplay;
    if (sDisplay) return sDisplay;
};

function startCountDown(msgID) {
    let timeleft = TIMEOUT_SECONDS;

    let newMsg = { msgID: msgID, counter: 'Counting...' };

    let downloadTimer = setInterval(function(){
        if(timeleft <= 0){
          clearInterval(downloadTimer);
          newMsg.counter = "Message is Deleted.";
        } else {
            newMsg.counter = '⚠️ ' + secondsToHms(timeleft) + "remaining to be removed this message.";
        }
        timeleft -= 1;
    }, 1000);
    postsStack.push(newMsg);
};

bot.on('video', async(ctx) => {
    allMediaPosts.push(ctx.message);
});

bot.command('random', (ctx) => {
    const videoMessage = allMediaPosts[ Math.floor(Math.random() * allMediaPosts.length)];
    const videoID = videoMessage.video.file_id;
    ctx.telegram.sendVideo(TO_CHANNEL,videoID, {
        caption: videoMessage.caption || '',
        caption_entities: videoMessage.caption_entities || []
    })
});

bot.on(['photo'], (ctx) => {
    startCountDown(ctx.update.message.message_id);
    ctx.telegram.sendMessage(ctx.chat.id, `🔰 *Forward This Message To Your 'Saved Messages' Collection*.\nMessage Will Be Automatically Deleted 🗑️ After ${secondsToHms(TIMEOUT_SECONDS)}.`,
    {
        reply_to_message_id: ctx.update.message.message_id,
        parse_mode: 'markdown',
        reply_markup: {
            inline_keyboard: [
                [{text: "Click Here To Check Remaining Time ⏰️", callback_data: 'checkTime'}]
            ]
        }
    }).then(() => {
        setTimeout(()=> {
            ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.message.message_id);
            ctx.telegram.deleteMessage(ctx.chat.id, (ctx.update.message.message_id + 1));
        },TIMEOUT_MILLISECONDS);
    });
});

bot.on('callback_query', async(ctx) => {
    const callback_post = postsStack.find((post) => post.msgID === ctx.update.callback_query.message.reply_to_message.message_id);
    await ctx.telegram.answerCbQuery( ctx.callbackQuery.id, `${callback_post.counter || 'Counting...'}` ,true );
})

bot.launch();
