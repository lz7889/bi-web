<template>
  <div class="page-container">
    <div class="chart">
      <ThreeMap ref="threeMapRef" />
    </div>
  </div>
</template>
<script setup>
import ThreeMap from '@/components/ThreeMap/index.vue';

const { proxy } = getCurrentInstance();

onMounted(() => {
  setTimeout(() => {
    proxy.$refs.threeMapRef.setOptions({
      map: 'chongqing',
      roam: true,
      rotate: true,
      scaleLimit: { min: 1, max: 5 },
      itemStyle: {
        // 地块拉伸高度
        depth: 3,
        // 顶部边界线配置
        topLine: {
          color: 0x00ffff,
          linewidth: 3,
        },
        // 底部边界线配置
        bottomLine: {
          color: 0x004488,
          linewidth: 2,
        },
        // 地块材质配置
        material: {
          color: 0x0066cc, // 主颜色
          transparent: true,
          opacity: 0.85, // 透明度
          emissive: 0x002244, // 自发光颜色
          emissiveIntensity: 0.6, // 自发光强度
          shininess: 100, // 光泽度
        },
        // 侧面边缘线配置
        edges: {
          color: 0x0088ff,
          transparent: true,
          opacity: 0.4,
        },
      },
      emphasis: {
        disabled: false,
        targetZ: 2, // 抽出高度
        itemStyle: {
          color: '#ffaa00', // 支持十六进制字符串
          emissive: 0xff3300, // 支持十六进制数字
          emissiveIntensity: 1.5,
          opacity: 1,
        },
      },
      series: [
        {
          name: 'bar',
          type: 'bar',
          heightRatio: 20,
          itemStyle: {
            color: '#00ff00',
            size: 0.8,
            material: {
              opacity: 0.9,
              emissiveIntensity: 0.5,
            },
            edges: {
              opacity: 0.8,
            },
          },
          label: {
            show: true,
            distance: 1,
            formatter: (params) => {
              return `${params.name}\n${params.value}`;
            },
            textStyle: {
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 'normal',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '2px 5px',
              borderRadius: '4px',
            },
          },
          data: [
            {
              name: '渝北区',
              value: 80,
              position: [106.746928, 29.810209],
              label: {
                textStyle: {
                  color: '#00ff00',
                  fontSize: 12,
                },
              },
            },
            {
              name: '北碚区',
              value: 60,
              itemStyle: {
                color: '#ff0000',
                size: 1,
                material: {
                  opacity: 0.8,
                  emissiveIntensity: 0.6,
                },
                edges: {
                  color: '#ffffff',
                  opacity: 0.9,
                },
              },
            },
            {
              name: '綦江区',
              value: 40,
            },
          ],
        },
      ],
    });
  }, 1000);
});
</script>
<style lang="scss" scoped>
.page-container {
  display: flex;
}
.chart {
  flex: 1;
  overflow: hidden;
}
</style>
