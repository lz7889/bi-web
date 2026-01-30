<template>
  <div ref="playerRef" class="player_box"></div>
</template>
<script setup>
import { onMounted, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  index: {
    type: Number,
    default: 1,
  },
  videoUrl: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    default: () => ({
      hasAudio: true,
      isLive: true,
      MSE: false,
      WCS: true,
    }),
  },
});

const playerRef = ref(null);
const playerInfo = ref(null);

const playCreate = () => {
  if (playerInfo.value) {
    playerInfo.value.destroy();
    playerInfo.value = null;
  }

  const easyplayer = new EasyPlayerPro(playerRef.value, {
    isLive: props.config.isLive,
    bufferTime: 0.2,
    stretch: false,
    MSE: props.config.MSE,
    WCS: props.config.WCS,
    hasAudio: props.config.hasAudio,
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
    console.log('is fullscreen', flag);
  });
  easyplayer.on('playbackRate', (rate) => {
    easyplayer.setRate(rate);
  });

  easyplayer.on('playbackSeek', (data) => {
    console.log('playbackSeek', data);
  });

  playerInfo.value = easyplayer;
};

// 播放视频
const playVideo = (url) => {
  if (!url) return;
  if (!playerInfo.value) {
    playCreate();
  }
  playerInfo.value.play(url);
};

// 停止播放
const stopVideo = () => {
  if (playerInfo.value) {
    playerInfo.value.pause();
  }
};

// 监听 videoUrl 变化
watch(
  () => props.videoUrl,
  (newUrl) => {
    if (newUrl) {
      playVideo(newUrl);
    } else {
      stopVideo();
    }
  },
);

onMounted(() => {
  playCreate();
  if (props.videoUrl) {
    playVideo(props.videoUrl);
  }
});

onBeforeUnmount(() => {
  if (playerInfo.value) {
    playerInfo.value.destroy();
    playerInfo.value = null;
  }
});

// 暴露方法给父组件
defineExpose({
  playVideo,
  stopVideo,
});
</script>
<style lang="scss" scoped>
.player_box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000000;
}
</style>
