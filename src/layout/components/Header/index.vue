<template>
  <div class="app-header">标题</div>
</template>
<script setup>
const { proxy } = getCurrentInstance();
</script>
<style lang="scss" scoped>
.app-header {
  height: 100px;
  flex-shrink: 0;
  background-image: url('@/assets/images/header.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>
