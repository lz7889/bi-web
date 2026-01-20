<template>
  <div class="player_box" id="player_box1"></div>
</template>
<script setup>
import { onMounted } from 'vue';

const { proxy } = getCurrentInstance();

const playerInfo = ref(null);

const videoUrl =
  'https://bdcloud-player-new.cdn.bcebos.com/testvideo/hls/265/1080p/liulangdiqiu/liulangdiqiu-265-1080.m3u8';
const config = {
  hasAudio: true,
  isLive: true,
  MSE: false,
  WCS: false,
};

const playCreate = () => {
  var container = document.getElementById('player_box1');
  var easyplayer = new EasyPlayerPro(container, {
    isLive: config.isLive, //默认 true
    bufferTime: 0.2, // 缓存时长
    stretch: false,
    MSE: config.MSE,
    WCS: config.WCS,
    hasAudio: config.hasAudio,
    watermark: { text: { content: 'easyplayer-pro' }, right: 10, top: 10 },
    isBand: true,
    btns: {
      play: true,
      audio: true,
      record: true,
      zoom: true,
      ptz: true,
      quality: true,
      stretch: false,
      screenshot: true,
      fullscreen: true,
    },
  });

  easyplayer.on('fullscreen', function (flag) {
    console.log('is fullscreen', id, flag);
  });
  easyplayer.on('playbackRate', (rate) => {
    easyplayer.setRate(rate);
  });

  easyplayer.on('playbackSeek', (data) => {
    console.log('playbackSeek', data);
  });
  playerInfo.value = easyplayer;
};

onMounted(() => {
  playCreate();
  playerInfo.value.play(videoUrl);
});
</script>
<style lang="scss" scoped>
.player_box {
  width: 600px;
  height: 400px;
}
</style>
