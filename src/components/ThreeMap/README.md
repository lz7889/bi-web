# ThreeMap 3D地图组件

基于 Three.js 的 3D 地图可视化组件，支持地图渲染、柱状图展示、交互高亮等功能。

## 功能特性

- 🗺️ 3D 地图渲染（支持中国地图、省级地图等）
- 📊 柱状图数据可视化
- 🎨 丰富的样式配置（颜色、透明度、发光效果等）
- 🖱️ 交互式高亮效果（鼠标悬停）
- 🎯 自适应视角和缩放
- 🏷️ 数据标签显示
- 🎮 相机控制（旋转、缩放、平移）

## 基础用法

```vue
<template>
  <div style="width: 100%; height: 600px;">
    <ThreeMap ref="mapRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ThreeMap from '@/components/ThreeMap/index.vue';

const mapRef = ref(null);

onMounted(() => {
  mapRef.value.setOptions({
    map: 'china', // 地图名称（对应 map 文件夹中的 json 文件）
  });
});
</script>
```

## 配置项说明

### setOptions(options)

组件暴露的主要方法，用于配置地图。

#### options 参数结构

```javascript
{
  map: 'china',           // 地图名称（必填）
  roam: true,             // 是否允许缩放和平移
  rotate: true,           // 是否允许旋转
  scaleLimit: {           // 缩放范围限制
    min: 1,
    max: 5
  },
  itemStyle: {},          // 地图样式配置
  emphasis: {},           // 高亮样式配置
  series: []              // 数据系列配置
}
```

### itemStyle - 地图样式配置

```javascript
itemStyle: {
  depth: 3,                    // 地块拉伸高度
  topLine: {                   // 顶部边界线
    color: '#00ffff',          // 支持 hex、rgb、rgba、CSS颜色名
    linewidth: 3
  },
  bottomLine: {                // 底部边界线
    color: '#004488',
    linewidth: 2
  },
  material: {                  // 地块材质
    color: '#0066cc',          // 主颜色
    transparent: true,
    opacity: 0.85,             // 透明度 0-1
    emissive: '#002244',       // 自发光颜色
    emissiveIntensity: 0.6,    // 自发光强度
    shininess: 100             // 光泽度
  },
  edges: {                     // 侧面边缘线
    color: '#0088ff',
    transparent: true,
    opacity: 0.4
  }
}
```

### emphasis - 高亮配置

```javascript
emphasis: {
  disabled: false,             // 是否禁用高亮效果
  targetZ: 3,                  // 高亮时抽出的高度
  itemStyle: {
    color: '#00ff88',          // 高亮颜色
    emissive: '#00ff88',       // 高亮自发光颜色
    emissiveIntensity: 1.2,    // 高亮自发光强度
    opacity: 1                 // 高亮透明度
  }
}
```

### series - 数据系列配置

#### 柱状图系列

```javascript
series: [
  {
    type: 'bar', // 系列类型
    heightRatio: 10, // 高度比例（value / heightRatio = barHeight）
    itemStyle: {
      // 柱状图样式（应用于所有数据）
      color: '#00ff00', // 柱状图颜色
      size: 0.5, // 柱状图宽度
      material: {
        transparent: true,
        opacity: 0.9,
        emissiveIntensity: 0.5,
        shininess: 100,
      },
      edges: {
        // 柱状图边框
        color: '#00ff00', // 不设置则使用 itemStyle.color
        transparent: true,
        opacity: 0.8,
      },
    },
    label: {
      // 标签配置（应用于所有数据）
      show: true, // 是否显示标签
      position: 'top', // 标签位置：top/center/bottom
      distance: 2, // 标签与柱状图的距离
      formatter: null, // 自定义格式化函数
      textStyle: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'MicrosoftYaHei',
        fontWeight: 'normal',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '2px 6px',
        borderRadius: '3px',
      },
    },
    data: [
      {
        name: '北京', // 省份名称（必填，需与地图数据匹配）
        value: 100, // 数据值（必填）
        position: [116.4, 39.9], // 可选：自定义位置（经纬度）
        itemStyle: {
          // 可选：单个数据的样式（覆盖 series.itemStyle）
          color: '#ff0000',
          size: 0.8,
        },
        label: {
          // 可选：单个数据的标签（覆盖 series.label）
          show: true,
          formatter: ({ name, value }) => `${name}\n${value}人`,
        },
      },
    ],
  },
];
```

## 完整示例

### 示例 1：基础地图

```vue
<template>
  <div style="width: 100%; height: 600px;">
    <ThreeMap ref="mapRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ThreeMap from '@/components/ThreeMap/index.vue';

const mapRef = ref(null);

onMounted(() => {
  mapRef.value.setOptions({
    map: 'china',
    itemStyle: {
      depth: 5,
      material: {
        color: '#1e90ff',
        opacity: 0.9,
      },
    },
  });
});
</script>
```

### 示例 2：带柱状图的地图

```vue
<template>
  <div style="width: 100%; height: 600px;">
    <ThreeMap ref="mapRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ThreeMap from '@/components/ThreeMap/index.vue';

const mapRef = ref(null);

onMounted(() => {
  mapRef.value.setOptions({
    map: 'china',
    roam: true,
    rotate: true,
    scaleLimit: {
      min: 0.5,
      max: 3,
    },
    itemStyle: {
      depth: 3,
      material: {
        color: '#0066cc',
        opacity: 0.85,
      },
    },
    emphasis: {
      disabled: false,
      targetZ: 5,
      itemStyle: {
        color: '#00ff88',
        emissiveIntensity: 1.5,
      },
    },
    series: [
      {
        type: 'bar',
        heightRatio: 10,
        itemStyle: {
          color: '#ffaa00',
          size: 0.6,
        },
        label: {
          show: true,
          position: 'top',
          distance: 2,
          formatter: ({ name, value }) => `${name}\n${value}`,
          textStyle: {
            color: '#ffffff',
            fontSize: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
          },
        },
        data: [
          { name: '北京', value: 2154 },
          { name: '上海', value: 2424 },
          { name: '广东', value: 12601 },
          { name: '浙江', value: 6456 },
          { name: '江苏', value: 8505 },
        ],
      },
    ],
  });
});
</script>
```

### 示例 3：自定义样式的柱状图

```vue
<script setup>
import { ref, onMounted } from 'vue';
import ThreeMap from '@/components/ThreeMap/index.vue';

const mapRef = ref(null);

onMounted(() => {
  mapRef.value.setOptions({
    map: 'china',
    series: [
      {
        type: 'bar',
        heightRatio: 5,
        data: [
          {
            name: '北京',
            value: 2154,
            itemStyle: {
              color: '#ff0000',
              size: 0.8,
            },
            label: {
              show: true,
              formatter: ({ name, value }) => `${name}\n人口: ${value}万`,
            },
          },
          {
            name: '上海',
            value: 2424,
            itemStyle: {
              color: '#00ff00',
              size: 0.7,
            },
            label: {
              show: true,
              position: 'center',
            },
          },
        ],
      },
    ],
  });
});
</script>
```

## 颜色格式支持

组件支持多种颜色格式：

```javascript
// 十六进制数字
color: 0xff0000;

// 十六进制字符串
color: '#ff0000';
color: '#f00';

// RGB 格式
color: 'rgb(255, 0, 0)';

// RGBA 格式（alpha 通道会被忽略）
color: 'rgba(255, 0, 0, 0.5)';

// CSS 颜色名称
color: 'red';
color: 'skyblue';
```

## 交互说明

- **左键拖动**：旋转地图
- **右键拖动**：平移地图
- **滚轮**：缩放地图
- **鼠标悬停**：高亮省份（可通过 `emphasis.disabled` 禁用）

## 地图文件

地图数据文件存放在 `src/components/ThreeMap/map/` 目录下，格式为 GeoJSON。

当前支持的地图：

- `china.json` - 中国地图
- `chongqing.json` - 重庆地图

添加新地图：

1. 将 GeoJSON 文件放入 `map/` 目录
2. 使用文件名（不含扩展名）作为 `map` 参数值

## 注意事项

1. 组件容器必须设置明确的宽高
2. `series.data` 中的 `name` 必须与地图数据中的省份名称完全匹配
3. 柱状图的 `value` 值会根据 `heightRatio` 计算实际高度
4. 标签的 `formatter` 函数接收 `{ name, value }` 参数，返回字符串（支持 `\n` 换行）
5. 样式配置支持三级覆盖：`data.itemStyle` > `series.itemStyle` > 默认样式

## API

### 方法

| 方法名     | 说明         | 参数            |
| ---------- | ------------ | --------------- |
| setOptions | 设置地图配置 | options: Object |

### 事件

| 事件名         | 说明                 | 回调参数 |
| -------------- | -------------------- | -------- |
| province-click | 省份点击事件（预留） | -        |

## 依赖

- three.js
- Vue 3
