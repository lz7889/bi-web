<template>
  <div class="app-wrapper">
    <!-- <Header /> -->
    <AppMain />
  </div>
</template>
<script setup>
import Header from './components/Header/index.vue';
import AppMain from './components/AppMain/index.vue';

const { proxy } = getCurrentInstance();
</script>
<style lang="scss" scoped>
.app-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-image: url('@/assets/images/background.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>
