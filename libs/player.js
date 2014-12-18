var Speaker = require('speaker');
var lame = require("lame");
var fs = require("fs");
var async = require("async");
var request = require("request");
var keypress = require("keypress");
var colorlog = require('ninja-colorlog');
var channels = [{channel:"public_tuijian_rege",content:"近期最热门的歌就在这里了!"},{channel:"public_tuijian_billboard",content:"Billboard金曲全收录 最Hot欧美大流行"},{channel:"public_tuijian_ktv",content:"网罗百听不厌的K歌金曲"},{channel:"public_tuijian_wangluo",content:"你不能错过的 最红网络流行曲!"},{channel:"public_tuijian_chengmingqu",
content:"还记得你与他们/她们相遇的第一首歌吗？"},{channel:"public_tuijian_yingshi",content:"熟悉的旋律 唤醒散落在影视剧里的回忆"},{channel:"public_tuijian_kaiche",content:"那些适合开车时听的歌 "},{channel:"public_shiguang_jingdianlaoge",content:"让我们聆听经典，回味青春。"},{channel:"public_shiguang_70hou",content:"往日的流行 今日的经典 那是属于我们的美好年代"},{channel:"public_shiguang_80hou",content:"一起听 那些陪伴80后成长的歌~"},{channel:"public_shiguang_90hou",content:"“年轻”没有定义，心与音乐共鸣!"},{channel:"public_shiguang_xinge",content:"第一时间收听潮流新曲 让耳朵新鲜每一天!"},{channel:"public_shiguang_erge",
content:"陪宝贝唱一首童真的歌"},{channel:"public_shiguang_lvxing",content:"音乐是旅途里的回忆 也是梦想中的目的地"},{channel:"public_shiguang_yedian",content:"跟着节奏一起舞动，点燃你的激情！"},{channel:"public_fengge_minyao",content:"放慢脚步 任时光流淌成一首温暖的歌"},{channel:"public_fengge_liuxing",content:"全球流行音乐全搜罗"},{channel:"public_fengge_dj",content:"国内外嗨爆DJ舞曲大集结!"},{channel:"public_fengge_qingyinyue",content:"抛开尘世的喧嚣 直抵心灵的避风港"},{channel:"public_fengge_xiaoqingxin",content:"只属于你的清新小世界"},{channel:"public_fengge_zhongguofeng",content:"在悠扬的旋律中感受流行音乐里的东方味道"},
{channel:"public_fengge_yaogun",content:"就是爱听摇滚乐!"},{channel:"public_fengge_dianyingyuansheng",content:"经典的故事 流转的旋律"},{channel:"public_xinqing_huankuai",content:"快乐的时候就要听快乐的歌"},{channel:"public_xinqing_jimo",content:"一个人的时光 我只想静静听一首歌"},{channel:"public_xinqing_shanggan",content:"心情不好的时候 情感共鸣是最好的安慰"},{channel:"public_xinqing_tianmi",content:"绽放在心里的小甜蜜 忍不住地嘴角上扬"},{channel:"public_xinqing_qingge",content:"总有一首歌 陪你走过爱情旅程"},{channel:"public_xinqing_shuhuan",content:"舒缓的节奏 安静地陪伴"},{channel:"public_xinqing_yonglanwuhou",
content:"用音乐 冲泡一杯清香惬意的下午茶"},{channel:"public_xinqing_qingsongjiari",content:"抛开烦恼，尽享假日的轻松自在!"},{channel:"public_yuzhong_huayu",content:"经典之外 让好音乐不再错过"},{channel:"public_yuzhong_oumei",content:"那些你听过的、没听过的、最动听的英文歌"},{channel:"public_yuzhong_riyu",content:"网罗最In流行曲 聆听最正日本范儿"},{channel:"public_yuzhong_hanyu",content:"K-pop正流行!"},{channel:"public_yuzhong_yueyu",content:"聆听粤语里的百转千回"},{channel:"public_tuijian_winter",content:"这个冬天，你需要一首暖心的歌"}];
var fmHost = "http://fm.baidu.com/";

function Player(){
    this.songList = [];
    this.decoderStream = null;
    this.speaker = null;
    this.stoped = false;
    this.eventMap = {};
    this.lrc = "";
    this.lrcInter = null;
    this.channel = "public_fengge_liuxing";
    this.attackEvent();
    this.channelChange();
    this.menuStatus = 0;
    this.listOpen = 0;
}

Player.prototype.play = function(){
    var self = this;
    if(this.songList.length < 1){
        this.getSongs(function(){
            self._play();
        });
    }else{
        self._play();
    }
};

Player.prototype.playNext = function(){
    this.stop();
};

Player.prototype.attackEvent = function(){
    var self = this;
    keypress(process.stdin);
    process.stdin.on("keypress", function(ch,key){
        if(key && key.name == "n"){
            self.playNext();
        }
        if(key && key.name == "q"){
            process.stdout.clearScreenDown();
            process.exit(0);
        }
        if(key && key.name == "s"){
            self.stoped = true;
            self.stop();
        }
        if(key && key.name == "w"){
            self.print_channel();
        }
        if(key && key.name == "l"){
            self.printList();
        }
        if(key && key.name == "p" && self.stoped == true){
            self.stoped = false;
            self.doPlay();   
        }
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
    print_Common();
};

Player.prototype.print_channel = function(){
    var self = this;
    if(self.menuStatus == 1){
        process.stdout.cursorTo(0, 15);
        process.stdout.clearScreenDown();
        self.menuStatus = 0;
    }else{
        process.stdout.cursorTo(0, 15);
        process.stdout.clearScreenDown();
        for(var i = 0 ; i < channels.length ; i++){
            colorlog.log.yellow('    '+(i+1)+': '+channels[i]['content']);
        }
        self.menuStatus = 1;    
    }
    
};

Player.prototype.channelChange = function(){
    var self = this;
    var timeout = null;
    for(var i = 0 ; i < channels.length ; i++){
        self.eventMap[(i+1)] = channels[i]['channel'];
    }
    var input = "";
    process.stdin.on("keypress", function(ch,key){
        if(ch >= 0 && ch <= 37){
            if(timeout){
                clearTimeout(timeout);
            }
            input += "" + ch;
            timeout = setTimeout(function(){
                self.playChannel(input);
                input = "";
                self.menuStatus = 0;
            },1000);
        }
    });
};

Player.prototype.playChannel = function(key){
    // console.log('channel index', key);
    var self = this;
    if(!self.eventMap[key]){
        return;
    }
    self.channel = self.eventMap[key];
    self.stop();
    self.songList = [];
};

Player.prototype.stop = function(){
    this.decoderStream && this.decoderStream.unpipe();
    this.decoderStream = null;
    this.speaker && this.speaker.end();
    print_Common();
};

Player.prototype.getSongs = function(cb){
    var self = this;
    var url = "http://fm.baidu.com/dev/api/?tn=playlist&id="+self.channel+"&special=flash&prepend=&format=json&_="+Date.now();
    request(url,function(err,response,body){
        if(err){
            //console.log(err);
            return;
        }
        //console.log(JSON.parse(body).list);
        var list = JSON.parse(body).list;
        getMp3Lists(getIds(list),function(lists){
            self.songList = self.songList.concat(lists);
            cb();
        });
    });
};

Player.prototype.printList = function(){
    var list = this.songList;
    if(this.listOpen){
        process.stdout.cursorTo(0,15);
        process.stdout.clearScreenDown();    
        this.listOpen = 0;
    }else{
        process.stdout.cursorTo(0,15);
        process.stdout.clearScreenDown();
        colorlog.log.yellow('再次按下l键关闭歌单');
        list.forEach(function(song){
            console.log(song.artistName,song.songName);
        });
        this.listOpen = 1;
    }
    
};

Player.prototype._play = function(){
    var self = this;
    var song = self.songList[0];
    print_Common();
    colorlog.log.green('开始缓冲',song.artistName,"的",song.songName);
    var req = request.get(song.songLink);
    var decoder = new lame.Decoder();
    self.speaker = new Speaker();
    var downloaded = 0;
    var totalSize = 0;
    var reqLrc = request.get(fmHost+song.lrcLink, function(err, res, body){
        if(err){
            return;
        }
        self.lrc = body.toString("utf-8");
    });
    req.on('response', function(res){
        //console.log(res.headers);
        process.stdout.moveCursor(0,-1);
        process.stdout.clearLine();
        totalSize = res.headers['content-length'];
        print_Common();
        colorlog.log.green('开始播放',song.artistName,"的",song.songName,"size",new Number(res.headers['content-length']/1024/1024).toFixed(2)+"M");
        self.startLrcShow();
        //colorlog.log.blue('下载进度监控', "0%");
    }).on('error',function(err){
        console.log('缓冲音乐失败，请检查网络后重试');
    }).on('data', function(chunk){
        if(typeof chunk != "string"){
            downloaded += chunk.length;
        }
        //process.stdout.moveCursor(0,-1);
        //process.stdout.clearLine();
        //colorlog.log.blue('下载进度监控', parseInt((downloaded / totalSize) * 100) +"%");
    }).on('close', function(res){
        //process.stdout.moveCursor(0,-2);
        //process.stdout.clearScreenDown();
        //console.log('当前音乐下载完成');
    });
    buffer = req.pipe(decoder);
    buffer.pipe(self.speaker).on('close', function(){
        if(!self.stoped){
            self.songList.shift();
            self.play();
        }
    });
    self.decoderStream = decoder;
};

Player.prototype.doPlay = function(){
    this._play();
};

Player.prototype.startLrcShow = function(){
    var self = this;
    var start = Date.now();
    if(self.lrcInter){
        clearInterval(self.lrcInter);
    }

    console.log('');
    self.lrcInter = setInterval(function(){
        var goTime = Date.now() - start;
        var sec = (parseInt(goTime / 1000)%60); // 过去的秒数
        if(sec < 10){
            sec = "0"+sec;
        }
        var min = Math.floor(parseInt(goTime / 1000) / 60);
        min = min < 10 ? "0"+min : min;
        var miniSec = (goTime%1000);
        if(miniSec < 10){
            miniSec = "0"+miniSec;
        }else if(miniSec < 100){
            miniSec = "0"+Math.floor(miniSec/10);
        }else{
            miniSec = Math.floor(miniSec/10);
        }
        var regs = min+":"+sec+"."+miniSec+"(.{1})([^\\n]*)";
        var reg = new RegExp(regs,"m");
        var lrc = self.lrc.match(reg);
        
        //console.log(lrc);
        if(lrc && lrc.length > 0){
            
            //console.log(min+":"+sec+"."+miniSec);
            if(lrc[2].trim() != ""){
                process.stdout.cursorTo(0,11);
                process.stdout.clearLine();
                colorlog.log.yellow(lrc[2]+"\n\n");
            }
        }
    },5);
    
    //setTimeout(function(){process.stdout.cursorTo(0,15);console.log(self.lrc);},5000);
};

function getIds(list,cb){
    var ret = [];
    list.forEach(function(item){
        ret.push(item.id);
    });
    return ret;
}

function listParse(songlists){
    var ret = [];
    songlists.forEach(function(song){
        if(song.songLink){
            ret.push(song);
        }
    });
    return ret;
}


function getMp3Lists(ids, cb){
    var now = Date.now();
    var url = "http://music.baidu.com/data/music/fmlink?songIds="+ids.join(",")+"&type=mp3&rate=128&callback=jsonlink"+now+"&_="+now;
    //console.log(url);
    request(url, function(err, response, body){
        if(err){
            //console.log(err);
            return;
        }

        var datas = JSON.parse(body.replace("jsonlink"+now+"(","").replace(/\)$/,""));
        var songlists = datas.data.songList;
        var list = listParse(songlists);
        cb(list);
    });
}
function print_Common(){
    process.stdout.cursorTo(0,0);
    process.stdout.clearScreenDown();
    colorlog.log.green('----------------------');
    colorlog.log.red('    百度音乐随心听');
    colorlog.log.green('    n: 下一首');
    colorlog.log.green('    p: 继续');
    colorlog.log.green('    s: 暂停');
    colorlog.log.green('    w: 选择音乐频道');
    colorlog.log.green('    l: 打印剩余歌单');
    colorlog.log.green('    q: 退出播放器');
    colorlog.log.green('----------------------');
}
module.exports = Player;
