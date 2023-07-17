/*
 * @Author: tackchen
 * @Date: 2021-11-17 14:54:43
 * @LastEditors: Please set LastEditors
 * @FilePath: \type\src\object\enemy.js
 * @Description: Coding something
 */
import J from 'jetterjs';
import {getDieImg, getEnemyImg} from '../resource';
import {Const, Game, Size} from '../store';

let EnemySpeed = 0;
let EnemySpeedMax = 2;

initEnemySpeed();


export function initEnemySpeed () {
    EnemySpeed = 0.4;
}

export function setEnemySpeed (speed, max) {
    EnemySpeed = speed;
    if (max) EnemySpeedMax = max;
}

export function addEnemySpeed () {
    if (EnemySpeed >= EnemySpeedMax) return;

    if (Game.loopIndex % 200 === 0) {
        EnemySpeed += 0.05;
    }
}
 
export const singleWord = JSON.parse('enemy.json');

const EnemySize = [{
    w: 33,
    h: 50
},
{
    w: 34,
    h: 65
},
{
    w: 67,
    h: 50
},
{
    w: 59,
    h: 100
}];
const HPHeight = 3,
    HPPerWidth = 4; // 生命值单位长度宽度

export class Enemy {
    constructor (x, y, a) {
        this.speed = EnemySpeed;
        this.type = J.checkArg(a, J.random(0, 3));
        this.w = EnemySize[this.type].w;
        this.h = EnemySize[this.type].h;
        this.x = J.checkArg(x, J.random(0, Size.gameWidth));
        this.y = J.checkArg(y, -this.h);
        this.words = singleWord[this.type][J.random(0, singleWord[this.type].length - 1)];
        this.pinyin = this.words.spell('low');
        this.hp = this.pinyin.length;
        this.hpBarW = this.hp * HPPerWidth;
        this.index = 0;
        this.img = getEnemyImg()[this.type];
        this.deg = -Math.atan((this.x - Game.player.x) / (this.y - Game.player.y));
        if (this.type == 0) {
            this.speed += 0.2;
        } else if (this.type == 3) {
            this.sendMax = 15000;
            this.sendIndex = 0;
        }
        this.dieImg = getDieImg();
        this.isDie = false;
        this.dieIndex = -1;
        this.dieLen = 100;
        this.isRemove = false;
    }
    
    act () {
        if (!this.isRemove) {
            if (this.isDie) {
                this.dieIndex++;
                if (this.dieIndex >= this.dieImg.length) {
                    this.dieIndex--;
                    this.remove();
                }
            } else {
                if (this.type == 3) {
                    this.sendIndex += Const.LoopTime;
                    if (this.sendIndex > this.sendMax) {
                        this.sendIndex = 0;
                        Game.enemys.insert(new Enemy(this.x, this.y, 0), Game.enemys.indexOf(this) + 1);
                    }
                }
                this.x -= this.speed * Math.sin(this.deg);
                this.y += this.speed * Math.cos(this.deg);
                if (this.touchTarget()) {
                    Game.player.die();
                }
            }
            this.draw();
        }
    }
    draw () {
        Game.ctx.save();
        Game.ctx.translate(this.x, this.y);
        Game.ctx.rotate(this.deg);
        Game.ctx.translate( - this.x, -this.y);
        if (this.isDie) {
            Game.ctx.drawImage(this.dieImg[this.dieIndex], this.x - this.dieLen / 2, this.y - this.dieLen / 2, this.dieLen, this.dieLen);
        } else {
            Game.ctx.font = '20px MicrosoftYahei';
            let a = this.y - this.h / 2;
            Game.ctx.drawImage(this.img, this.x - this.w / 2, a, this.w, this.h);
            Game.ctx.fillText(this.words, this.x, a - 8);
            Game.ctx.fillStyle = '#f44';
            a += this.h;
            Game.ctx.fillRect(this.x - this.hpBarW / 2, a + HPPerWidth, this.hpBarW, HPHeight);
            Game.ctx.fillText(this.pinyin.substring(0, this.pinyin.length - this.hp), this.x, a + HPPerWidth * 5);
            Game.ctx.fillStyle = '#4f4';
            Game.ctx.fillRect(this.x - this.hpBarW / 2, a + HPPerWidth, this.hp * HPPerWidth, HPHeight);
        }
        Game.ctx.restore();
    }
    hurt () {
        this.hp--;
        this.x += this.speed * Math.sin(this.deg) * 3;
        this.y -= this.speed * Math.cos(this.deg) * 3;
        if (this.hp == 0) {
            this.die();
        }
    }
    touchTarget () {
        return (this.y + this.h / 2 > Game.player.y - Game.player.h / 2);
    }
    die () {
        this.dieIndex = 0;
        this.isDie = true;
    }
    remove () {
        this.isRemove = true;
        Game.player.setScore();
        Game.enemys.remove(this);
        Game.enemys.sortByAttr('y', false);
    }
    check (a) {
        if (this.index < this.pinyin.length) {
            if (a == this.pinyin[this.index]) {
                this.index++;
                return true;
            }
        }
        return false;
    }
    resetDeg () {
        this.deg = -Math.atan((this.x - Game.player.x) / (this.y - Game.player.y));
    }
}