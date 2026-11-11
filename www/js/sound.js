// Синтезированные звуки (WebAudio), без внешних файлов
const Snd=(()=>{let ac=null,on=true;
function ctx(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ac&&ac.state==='suspended')ac.resume();return ac}
function tone(f,d,type='sine',v=.15,delay=0,slide=0){const a=ctx();if(!a||!on)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02)}
return{unlock:ctx,toggle(){on=!on;return on},
click(){tone(800,.05,'square',.05)},
build(){tone(200,.08,'square',.1);tone(150,.1,'square',.1,.1)},
cash(){tone(1200,.08,'triangle',.12);tone(1600,.15,'triangle',.12,.08)},
arrive(){tone(660,.12,'sine',.08);tone(880,.15,'sine',.08,.12)},
bad(){tone(300,.4,'sawtooth',.1,0,.5)},
boom(){tone(80,.6,'sawtooth',.25,0,.3);tone(60,.8,'square',.2,.05,.4)},
win(){[523,659,784,1046].forEach((f,i)=>tone(f,.25,'triangle',.15,i*.15))},
pa(){tone(523,.15,'sine',.1);tone(659,.15,'sine',.1,.15);tone(784,.25,'sine',.1,.3)}}})();
