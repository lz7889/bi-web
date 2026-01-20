<template>
  <div class="app-main">
    <router-view></router-view>
  </div>
</template>
<script setup>
const { proxy } = getCurrentInstance();
</script>
<style lang="scss" scoped>
.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
