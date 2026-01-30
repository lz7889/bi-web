<template>
  <div class="easy-player">
    <div class="easy-player-main" :style="gridStyle">
      <EasyPlayer
        v-for="item in state.number"
        :key="item"
        :index="item"
        :video-url="state.playingUrl"
        :ref="(el) => setPlayerRef(el, item)"
      />
    </div>
    <div class="easy-player-aside">
      <el-row :gutter="20">
        <el-col :span="3">
          <el-input v-model.number="state.number" type="number" :min="1" :max="16">
            <template #prepend>
              <div class="prepend-label">分屏数量</div>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="state.url" placeholder="请输入视频流地址">
            <template #prepend>
              <div class="prepend-label">URL</div>
            </template>
          </el-input>
        </el-col>
      </el-row>
      <div class="btns">
        <el-button type="primary" @click="handlePlay">播放</el-button>
        <el-button @click="handleStop">停止</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ElMessage } from 'element-plus';
import EasyPlayer from '@/components/EasyPlayer/index.vue';

const state = reactive({
  number: 9,
  url: 'http://172.16.9.6:8080/live/test001/hls.m3u8',
  playingUrl: '',
});

const playerRefs = ref({});

// 设置播放器引用
const setPlayerRef = (el, index) => {
  if (el) {
    playerRefs.value[index] = el;
  }
};

// 根据视频数量计算网格布局
const gridStyle = computed(() => {
  const num = state.number;
  let cols = 1;

  if (num === 1) {
    cols = 1;
  } else if (num === 2) {
    cols = 2;
  } else if (num <= 4) {
    cols = 2;
  } else if (num <= 6) {
    cols = 3;
  } else if (num <= 9) {
    cols = 3;
  } else if (num <= 16) {
    cols = 4;
  } else {
    cols = 4;
  }

  return {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
  };
});

// 播放视频
const handlePlay = () => {
  if (!state.url) {
    ElMessage.warning('请输入视频流地址');
    return;
  }

  state.playingUrl = state.url;
  ElMessage.success('开始播放');
};

// 停止播放
const handleStop = () => {
  state.playingUrl = '';
  Object.values(playerRefs.value).forEach((player) => {
    if (player && player.stopVideo) {
      player.stopVideo();
    }
  });
  ElMessage.info('已停止播放');
};
</script>
<style lang="scss" scoped>
.easy-player {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .easy-player-main {
    flex: 1;
    overflow: auto;
    display: grid;
    gap: 2px;
    background-color: #000;
  }
  .easy-player-aside {
    padding: 20px;
    overflow: auto;
    border-top: 2px solid #eeeeee;
    display: flex;
    .el-row {
      flex: 1;
      overflow: hidden;
      .el-col {
        margin-bottom: 10px;
      }
      .prepend-label {
        width: 80px;
      }
    }
    .btns {
      margin-left: 20px;
    }
  }
}
</style>
