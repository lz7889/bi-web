<template>
  <div class="map-container" ref="mapRef"></div>
</template>
<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { onMounted, ref } from 'vue';

const { proxy } = getCurrentInstance();

// 定义 emits
const emit = defineEmits(['province-click']);

let scene, camera, renderer, controls, mapGroup, labelRenderer;
const fov = 70; // 视角角度
let hoveredProvince = null; // 当前悬停的省份组
const animationSpeed = 0.15; // 动画速度

// 当前地图配置
let currentMapConfig = ref({});

// 当前高亮配置
let currentEmphasisConfig = ref({});

// 默认柱状图样式配置
const defaultBarStyleConfig = {
  // 柱状图宽度
  size: 0.5,
  // 柱状图高度比例（value / heightRatio = barHeight）
  heightRatio: 10,
  // 柱状图材质配置
  material: {
    transparent: true,
    opacity: 0.9,
    emissiveIntensity: 0.5,
    shininess: 100,
  },
  // 柱状图边框配置
  edges: {
    transparent: true,
    opacity: 0.8,
  },
  // 标签配置
  label: {
    show: false,
    position: 'top', // top, center, bottom
    distance: 2, // 标签与数据点之间的距离
    formatter: null, // 自定义格式化函数 (params) => string, params: { name, value }
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
};

// 默认样式配置
const defaultStyleConfig = {
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
};

// 默认高亮配置
const defaultEmphasisConfig = {
  // 是否禁用高亮
  disabled: false,
  // 高亮时抽出的高度
  targetZ: 3,
  // 高亮时材质配置
  itemStyle: {
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 1.2,
    opacity: 1,
  },
};

// 懒加载配置
const mapModules = import.meta.glob('./map/*.json');

// 颜色格式转换函数
const parseColor = (color) => {
  if (color === undefined || color === null) return null;

  // 如果已经是数字（十六进制），直接返回
  if (typeof color === 'number') {
    return color;
  }

  // 如果是字符串
  if (typeof color === 'string') {
    color = color.trim();

    // 处理十六进制格式 #RRGGBB 或 #RGB
    if (color.startsWith('#')) {
      return parseInt(color.substring(1), 16);
    }

    // 处理 rgb(r, g, b) 格式
    const rgbMatch = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return (r << 16) | (g << 8) | b;
    }

    // 处理 rgba(r, g, b, a) 格式 - 忽略 alpha 通道，因为 THREE.js 颜色不包含 alpha
    const rgbaMatch = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/i);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      return (r << 16) | (g << 8) | b;
    }

    // 处理 CSS 颜色名称（通过 THREE.Color）
    try {
      const threeColor = new THREE.Color(color);
      return threeColor.getHex();
    } catch (e) {
      console.warn(`无法解析颜色: ${color}，使用默认颜色`);
      return null;
    }
  }

  return null;
};

// 异步加载地图数据
const loadMap = async (mapName) => {
  const path = `./map/${mapName}.json`;
  if (mapModules[path]) {
    const module = await mapModules[path]();
    return module.default || module;
  }
  throw new Error(`地图文件 ${mapName}.json 不存在`);
};

// 初始化three
const initThree = () => {
  const w = proxy.$refs['mapRef']?.clientWidth;
  const h = proxy.$refs['mapRef']?.clientHeight;
  // 创建场景
  scene = new THREE.Scene();
  // 添加相机
  const k = w / h;
  camera = new THREE.PerspectiveCamera(fov, k, 1, 1000); // 增大视野角度
  camera.position.set(0, -80, 200); // 调整相机位置
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  proxy.$refs['mapRef']?.appendChild(renderer.domElement);

  // 创建CSS2D渲染器（用于标签）
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(w, h);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  proxy.$refs['mapRef']?.appendChild(labelRenderer.domElement);

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 2); // 增强环境光
  scene.add(ambientLight);

  // 添加主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(80, 80, 80);
  scene.add(directionalLight);

  // 设置相机控件
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20; // 调整最小距离
  controls.maxDistance = 200; // 增大最大距离
  controls.enableRotate = true; // 允许旋转
  controls.enableZoom = true; // 允许缩放
  controls.enablePan = true; // 允许平移（拖动）
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE, // 左键旋转
    MIDDLE: THREE.MOUSE.DOLLY, // 中键缩放
    RIGHT: THREE.MOUSE.PAN, // 右键平移
  };

  // 添加鼠标交互
  addMouseInteraction();

  // 动画循环
  animate();
};

// 鼠标交互
const addMouseInteraction = () => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  let lastHoveredProvinceName = null; // 记录上次悬停的省份名称
  let isInteracting = false; // 标记是否正在进行交互操作（旋转、平移、缩放）

  // 监听控制器的交互状态
  controls.addEventListener('start', () => {
    isInteracting = true;
  });

  controls.addEventListener('end', () => {
    isInteracting = false;
  });

  const onMouseMove = (event) => {
    if (!mapGroup) return; // 如果地图组不存在，直接返回

    // 如果正在进行交互操作，直接返回
    if (isInteracting) return;

    // 如果禁用了高亮效果，直接返回
    const emphasisConfig = currentEmphasisConfig.value;
    if (emphasisConfig.disabled) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    // 检测所有场景中的对象（包括柱状图）
    const intersects = raycaster.intersectObjects(scene.children, true);

    let currentProvinceName = null;
    let isHoveringBar = false;

    // 查找当前悬停的对象
    if (intersects.length > 0) {
      // 先检查是否悬停在柱状图上（只检测柱状图本体，不包括边框）
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        // 只检测柱状图本体，排除边框
        if (object.name.includes('_bar') && !object.name.includes('_bar_edges')) {
          isHoveringBar = true;
          break;
        }
      }

      // 如果没有悬停在柱状图上，再检查是否悬停在地图上
      if (!isHoveringBar) {
        for (let i = 0; i < intersects.length; i++) {
          const object = intersects[i].object;
          if (object.userData.name && object.name.includes('_mesh')) {
            currentProvinceName = object.userData.name;
            break;
          }
        }
      }
    }

    // 如果悬停在柱状图上，清除地图高亮
    if (isHoveringBar) {
      // 恢复之前高亮的对象
      if (hoveredMesh) {
        hoveredMesh.material.color.setHex(hoveredMesh.userData.originalColor);
        hoveredMesh.material.emissive.setHex(hoveredMesh.userData.originalEmissive);
        hoveredMesh.material.emissiveIntensity = hoveredMesh.userData.originalEmissiveIntensity;
        if (emphasisConfig.itemStyle?.opacity !== undefined) {
          hoveredMesh.material.opacity = hoveredMesh.userData.originalOpacity;
        }
        hoveredMesh = null;
      }

      // 恢复之前悬停的省份位置
      if (hoveredProvince) {
        hoveredProvince.userData.targetZ = 0;
        hoveredProvince.userData.isHovered = false;
        hoveredProvince = null;
      }

      renderer.domElement.style.cursor = 'pointer';
      lastHoveredProvinceName = null;
      return;
    }

    // 只有当悬停的省份发生变化时才更新
    if (currentProvinceName !== lastHoveredProvinceName) {
      // 恢复之前高亮的对象
      if (hoveredMesh) {
        hoveredMesh.material.color.setHex(hoveredMesh.userData.originalColor);
        hoveredMesh.material.emissive.setHex(hoveredMesh.userData.originalEmissive);
        hoveredMesh.material.emissiveIntensity = hoveredMesh.userData.originalEmissiveIntensity;
        if (emphasisConfig.itemStyle?.opacity !== undefined) {
          hoveredMesh.material.opacity = hoveredMesh.userData.originalOpacity;
        }
        hoveredMesh = null;
      }

      // 恢复之前悬停的省份位置
      if (hoveredProvince) {
        hoveredProvince.userData.targetZ = 0;
        hoveredProvince.userData.isHovered = false;
        hoveredProvince = null;
        renderer.domElement.style.cursor = 'default';
      }

      // 高亮新的省份
      if (currentProvinceName) {
        // 找到mesh并高亮
        const provinceGroup = mapGroup.children.find((child) => child.name === currentProvinceName + '_group');

        if (provinceGroup) {
          const mesh = provinceGroup.children.find((child) => child.name === currentProvinceName + '_mesh');

          if (mesh) {
            hoveredMesh = mesh;

            // 应用高亮样式
            const highlightStyle = emphasisConfig.itemStyle || {};

            if (highlightStyle.color !== undefined) {
              mesh.material.color.setHex(highlightStyle.color);
            }
            if (highlightStyle.emissive !== undefined) {
              mesh.material.emissive.setHex(highlightStyle.emissive);
            }
            if (highlightStyle.emissiveIntensity !== undefined) {
              mesh.material.emissiveIntensity = highlightStyle.emissiveIntensity;
            }
            if (highlightStyle.opacity !== undefined) {
              mesh.material.opacity = highlightStyle.opacity;
            }
          }

          // 抽出省份
          hoveredProvince = provinceGroup;
          provinceGroup.userData.targetZ = emphasisConfig.targetZ ?? 3; // 使用配置的抽出高度
          provinceGroup.userData.isHovered = true;
          renderer.domElement.style.cursor = 'pointer';
        }
      }

      console.log('当前悬停的省份:', currentProvinceName, '是否悬停柱状图:', isHoveringBar);

      lastHoveredProvinceName = currentProvinceName;
    }
  };

  renderer.domElement.addEventListener('mousemove', onMouseMove);
};

// 动画循环
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();

  // 更新省份抽出动画
  if (mapGroup) {
    mapGroup.children.forEach((child) => {
      if (child.name.includes('_group') && child.userData) {
        const userData = child.userData;
        // 平滑过渡到目标位置
        if (Math.abs(userData.currentZ - userData.targetZ) > 0.01) {
          userData.currentZ += (userData.targetZ - userData.currentZ) * animationSpeed;
          child.position.z = userData.currentZ;

          // 同步更新对应的柱状图位置
          const provinceName = userData.name;
          const bar = scene.children.find((obj) => obj.name === provinceName + '_bar');
          const barEdges = scene.children.find((obj) => obj.name === provinceName + '_bar_edges');
          const barLabel = scene.children.find((obj) => obj.name === provinceName + '_bar_label');

          if (bar && bar.userData) {
            const targetZ = bar.userData.baseZ + userData.currentZ;
            bar.position.z = targetZ;
          }

          if (barEdges && barEdges.userData) {
            const targetZ = barEdges.userData.baseZ + userData.currentZ;
            barEdges.position.z = targetZ;
          }

          if (barLabel && barLabel.userData) {
            const targetZ = barLabel.userData.baseZ + userData.currentZ;
            barLabel.position.z = targetZ;
          }
        }
      }
    });
  }

  renderer.render(scene, camera);
  if (labelRenderer) {
    labelRenderer.render(scene, camera);
  }
};

// 将经纬度转换为3D坐标
const projection = (coordinates) => {
  const [lon, lat] = coordinates;
  // 使用当前地图配置的中心点和缩放比例
  const center = currentMapConfig.value?.center || [104, 36];
  const scale = currentMapConfig.value?.scale || 5;
  const [centerLon, centerLat] = center;
  const x = (lon - centerLon) * scale;
  const y = (lat - centerLat) * scale;
  return [x, y];
};

// 绘制地图
const drawMap = (mapData, styleConfig) => {
  clearMap();

  const optimalView = calculateOptimalView(mapData);
  currentMapConfig.value = {
    mapData,
    styleConfig,
    ...optimalView,
  };

  console.log('当前地图配置:', currentMapConfig.value);

  // 创建地图组
  mapGroup = new THREE.Group();
  mapGroup.name = 'mapGroup';

  // 遍历地图要素创建省份
  mapData.features.forEach((feature) => {
    const { properties, geometry } = feature;
    const { name, center, centroid } = properties;
    const centerCoord = center || centroid;

    const processPolygon = (polygon) => {
      polygon.forEach((ring) => createProvince(ring, name, centerCoord));
    };

    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(processPolygon);
    } else if (geometry.type === 'Polygon') {
      processPolygon(geometry.coordinates);
    }
  });

  scene.add(mapGroup);

  // 更新相机位置
  const [camX, camY, camZ] = currentMapConfig.value.cameraPosition;
  camera.position.set(camX, camY, camZ);
  controls.target.set(0, 0, (styleConfig?.depth || defaultStyleConfig.depth) / 2);
  controls.update();
};

// 清除地图
const clearMap = () => {
  if (!mapGroup) return;

  // 移除地图组并清理资源
  scene.remove(mapGroup);
  mapGroup.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  mapGroup = null;
};

// 创建省份
const createProvince = (coordinates, name, centerCoord) => {
  const styleConfig = currentMapConfig.value?.styleConfig || defaultStyleConfig;
  const { depth } = styleConfig;

  // 创建省份组
  const provinceGroup = new THREE.Group();
  provinceGroup.name = `${name}_group`;

  // 计算中心点
  let centroid = null;
  if (centerCoord?.length === 2) {
    centroid = projection(centerCoord);
  }

  provinceGroup.userData = {
    name,
    originalZ: 0,
    targetZ: 0,
    currentZ: 0,
    isHovered: false,
    centroid,
  };

  // 创建顶部和底部边界线
  const createBorderLine = (zPosition, config, suffix) => {
    const points = coordinates.map((coord) => {
      const [x, y] = projection(coord);
      return new THREE.Vector3(x, y, zPosition);
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: config.color,
      linewidth: config.linewidth,
    });
    const line = new THREE.Line(geometry, material);
    line.name = `${name}_${suffix}`;
    return line;
  };

  provinceGroup.add(createBorderLine(depth, styleConfig.topLine, 'line'));
  provinceGroup.add(createBorderLine(0, styleConfig.bottomLine, 'bottom_line'));

  // 创建3D拉伸面
  const shape = new THREE.Shape();
  coordinates.forEach((coord, index) => {
    const [x, y] = projection(coord);
    index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });

  // 创建材质和网格
  const material = new THREE.MeshPhongMaterial({
    ...styleConfig.material,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${name}_mesh`;
  mesh.userData = {
    name,
    originalColor: styleConfig.material.color,
    originalEmissive: styleConfig.material.emissive,
    originalEmissiveIntensity: styleConfig.material.emissiveIntensity,
    originalOpacity: styleConfig.material.opacity,
  };
  provinceGroup.add(mesh);

  // 添加侧面边缘线
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: styleConfig.edges.color,
    transparent: styleConfig.edges.transparent,
    opacity: styleConfig.edges.opacity,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.name = `${name}_edges`;
  provinceGroup.add(edges);

  mapGroup.add(provinceGroup);
};

// 添加柱状图
const addBarCharts = (barSerie) => {
  const { data, itemStyle: barItemStyle, heightRatio: barHeightRatio, label: barLabel } = barSerie;
  const styleConfig = currentMapConfig.value?.styleConfig || defaultStyleConfig;
  const mapDepth = styleConfig.depth;

  // 获取高度比例：bar.heightRatio > 默认值
  const heightRatio = barHeightRatio ?? defaultBarStyleConfig.heightRatio;

  // 合并标签配置
  const labelConfig = {
    show: barLabel?.show ?? defaultBarStyleConfig.label.show,
    position: barLabel?.position ?? defaultBarStyleConfig.label.position,
    distance: barLabel?.distance ?? defaultBarStyleConfig.label.distance,
    formatter: barLabel?.formatter ?? defaultBarStyleConfig.label.formatter,
    textStyle: {
      color: barLabel?.textStyle?.color ?? defaultBarStyleConfig.label.textStyle.color,
      fontSize: barLabel?.textStyle?.fontSize ?? defaultBarStyleConfig.label.textStyle.fontSize,
      fontFamily: barLabel?.textStyle?.fontFamily ?? defaultBarStyleConfig.label.textStyle.fontFamily,
      fontWeight: barLabel?.textStyle?.fontWeight ?? defaultBarStyleConfig.label.textStyle.fontWeight,
      backgroundColor: barLabel?.textStyle?.backgroundColor ?? defaultBarStyleConfig.label.textStyle.backgroundColor,
      padding: barLabel?.textStyle?.padding ?? defaultBarStyleConfig.label.textStyle.padding,
      borderRadius: barLabel?.textStyle?.borderRadius ?? defaultBarStyleConfig.label.textStyle.borderRadius,
    },
  };

  data.forEach((item) => {
    const { name, value, position, itemStyle: dataItemStyle, label: dataLabel } = item;
    // 查找对应的省份组
    const provinceGroup = mapGroup.children.find((child) => child.name === name + '_group');
    if (provinceGroup) {
      // 使用预先计算好的质心坐标
      const centroid = position ? projection(position) : provinceGroup.userData.centroid;
      if (!centroid) {
        console.warn(`省份 ${name} 没有质心坐标，跳过柱状图绘制`);
        return;
      }
      const [centerX, centerY] = centroid;

      // 获取地块的颜色作为默认颜色
      const provinceMesh = provinceGroup.children.find((child) => child.name === name + '_mesh');
      const defaultColor = provinceMesh ? provinceMesh.userData.originalColor : styleConfig.material.color;

      // 合并样式配置：data.itemStyle > bar.itemStyle > 默认样式
      const finalItemStyle = {
        color: parseColor(dataItemStyle?.color) ?? parseColor(barItemStyle?.color) ?? defaultColor,
        size: dataItemStyle?.size ?? barItemStyle?.size ?? defaultBarStyleConfig.size,
        material: {
          transparent:
            dataItemStyle?.material?.transparent ??
            barItemStyle?.material?.transparent ??
            defaultBarStyleConfig.material.transparent,
          opacity:
            dataItemStyle?.material?.opacity ??
            barItemStyle?.material?.opacity ??
            defaultBarStyleConfig.material.opacity,
          emissiveIntensity:
            dataItemStyle?.material?.emissiveIntensity ??
            barItemStyle?.material?.emissiveIntensity ??
            defaultBarStyleConfig.material.emissiveIntensity,
          shininess:
            dataItemStyle?.material?.shininess ??
            barItemStyle?.material?.shininess ??
            defaultBarStyleConfig.material.shininess,
        },
        edges: {
          color:
            parseColor(dataItemStyle?.edges?.color) ??
            parseColor(barItemStyle?.edges?.color) ??
            parseColor(dataItemStyle?.color) ??
            parseColor(barItemStyle?.color) ??
            defaultColor,
          transparent:
            dataItemStyle?.edges?.transparent ??
            barItemStyle?.edges?.transparent ??
            defaultBarStyleConfig.edges.transparent,
          opacity: dataItemStyle?.edges?.opacity ?? barItemStyle?.edges?.opacity ?? defaultBarStyleConfig.edges.opacity,
        },
      };

      // 柱状图高度根据数据值和高度比例计算
      const barHeight = value / heightRatio;
      // 柱状图宽度
      const barSize = finalItemStyle.size;

      // 创建柱状图几何体
      const barGeometry = new THREE.BoxGeometry(barSize, barSize, barHeight);

      const barMaterial = new THREE.MeshPhongMaterial({
        color: finalItemStyle.color,
        transparent: finalItemStyle.material.transparent,
        opacity: finalItemStyle.material.opacity,
        emissive: finalItemStyle.color,
        emissiveIntensity: finalItemStyle.material.emissiveIntensity,
        shininess: finalItemStyle.material.shininess,
      });
      const bar = new THREE.Mesh(barGeometry, barMaterial);
      // 设置柱状图位置（在省份中心，z轴从地图顶部开始向上）
      const barZ = mapDepth + barHeight / 2;
      bar.position.set(centerX, centerY, barZ);
      bar.name = name + '_bar';
      bar.userData = {
        name,
        value,
        originalColor: finalItemStyle.color,
        baseX: centerX,
        baseY: centerY,
        baseZ: barZ,
        currentZ: 0,
        targetZ: 0,
      };

      // 添加柱状图边框
      const edgesGeometry = new THREE.EdgesGeometry(barGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: finalItemStyle.edges.color,
        transparent: finalItemStyle.edges.transparent,
        opacity: finalItemStyle.edges.opacity,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.position.copy(bar.position);
      edges.name = name + '_bar_edges';
      edges.userData = {
        name,
        baseX: centerX,
        baseY: centerY,
        baseZ: barZ,
        currentZ: 0,
        targetZ: 0,
      };

      // 添加到场景
      scene.add(bar);
      scene.add(edges);

      // 合并标签配置：data.label > bar.label > 默认配置
      const finalLabelConfig = {
        show: dataLabel?.show ?? labelConfig.show,
        position: dataLabel?.position ?? labelConfig.position,
        distance: dataLabel?.distance ?? labelConfig.distance,
        formatter: dataLabel?.formatter ?? labelConfig.formatter,
        textStyle: {
          color: dataLabel?.textStyle?.color ?? labelConfig.textStyle.color,
          fontSize: dataLabel?.textStyle?.fontSize ?? labelConfig.textStyle.fontSize,
          fontFamily: dataLabel?.textStyle?.fontFamily ?? labelConfig.textStyle.fontFamily,
          fontWeight: dataLabel?.textStyle?.fontWeight ?? labelConfig.textStyle.fontWeight,
          backgroundColor: dataLabel?.textStyle?.backgroundColor ?? labelConfig.textStyle.backgroundColor,
          padding: dataLabel?.textStyle?.padding ?? labelConfig.textStyle.padding,
          borderRadius: dataLabel?.textStyle?.borderRadius ?? labelConfig.textStyle.borderRadius,
        },
      };

      // 创建标签
      if (finalLabelConfig.show) {
        createBarLabel(name, value, centerX, centerY, barHeight, mapDepth, finalLabelConfig);
      }
    }
  });
};

// 创建柱状图标签
const createBarLabel = (name, value, centerX, centerY, barHeight, mapDepth, labelConfig) => {
  const { position, distance, formatter, textStyle } = labelConfig;

  // 格式化文本
  let labelText = formatter ? formatter({ name, value }) : `${value}`;

  // 创建标签DOM元素
  const labelDiv = document.createElement('div');
  labelDiv.className = 'bar-label';
  labelDiv.textContent = labelText;
  labelDiv.style.fontSize = `${textStyle.fontSize}px`;
  labelDiv.style.color = textStyle.color;
  labelDiv.style.fontFamily = textStyle.fontFamily;
  labelDiv.style.fontWeight = textStyle.fontWeight;
  labelDiv.style.padding = textStyle.padding;
  labelDiv.style.background = textStyle.backgroundColor;
  labelDiv.style.borderRadius = textStyle.borderRadius;
  labelDiv.style.whiteSpace = 'pre-wrap'; // 支持换行符
  labelDiv.style.textAlign = 'center';
  labelDiv.style.userSelect = 'none';
  labelDiv.style.lineHeight = '1.5';

  // 创建CSS2DObject
  const label = new CSS2DObject(labelDiv);
  label.name = name + '_bar_label';

  // 计算标签位置
  let labelZ;
  switch (position) {
    case 'top':
      labelZ = mapDepth + barHeight + distance;
      break;
    case 'center':
      labelZ = mapDepth + barHeight / 2;
      break;
    case 'bottom':
      labelZ = mapDepth + distance;
      break;
    default:
      labelZ = mapDepth + barHeight + distance;
  }

  label.position.set(centerX, centerY, labelZ);
  label.userData = {
    name,
    baseX: centerX,
    baseY: centerY,
    baseZ: labelZ,
    currentZ: 0,
    targetZ: 0,
  };

  scene.add(label);
};

// 根据地图数据自动计算最佳相机位置和缩放比例
const calculateOptimalView = (mapData) => {
  const bounds = calculateMapBounds(mapData);

  // 计算地图中心点
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  // 计算地图跨度
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;

  // 根据跨度计算缩放比例（让地图占据视口的合适大小）
  const targetSize = 65; // 减小目标尺寸，让地图缩小一些
  const scale = Math.min(targetSize / lonSpan, targetSize / latSpan);

  // 计算相机距离（基于缩放后的地图大小）
  const mapWidth = lonSpan * scale;
  const mapHeight = latSpan * scale;
  const maxDimension = Math.max(mapWidth, mapHeight);

  // 相机距离计算：确保整个地图可见
  // 使用视野角度(FOV)和地图尺寸计算合适的距离
  const cameraDistance = (maxDimension / (2 * Math.tan((fov * Math.PI) / 360))) * 1.8; // 增大系数，让相机更远

  // 相机位置：稍微偏后和偏上，形成俯视角度
  const cameraY = -cameraDistance * 0.4; // 向后偏移
  const cameraZ = cameraDistance * 0.9; // 高度，增加高度比例

  return {
    center: [centerLon, centerLat],
    scale: scale,
    cameraPosition: [0, cameraY, cameraZ],
    bounds: bounds,
  };
};

// 计算地图边界
const calculateMapBounds = (mapData) => {
  const bounds = {
    minLon: Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  };

  const processCoordinates = (coords) => {
    coords.forEach((coord) => {
      if (Array.isArray(coord[0])) {
        processCoordinates(coord);
      } else {
        const [lon, lat] = coord;
        bounds.minLon = Math.min(bounds.minLon, lon);
        bounds.maxLon = Math.max(bounds.maxLon, lon);
        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
      }
    });
  };

  mapData.features.forEach((feature) => {
    const { geometry } = feature;
    const coords = geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : geometry.coordinates;
    processCoordinates(coords);
  });

  return bounds;
};

// 合并样式配置
const mergeStyleConfig = (customStyle) => {
  if (!customStyle) return defaultStyleConfig;

  // 处理颜色转换
  const processedStyle = {
    depth: customStyle.depth ?? defaultStyleConfig.depth,
    topLine: {
      color: parseColor(customStyle.topLine?.color) ?? defaultStyleConfig.topLine.color,
      linewidth: customStyle.topLine?.linewidth ?? defaultStyleConfig.topLine.linewidth,
    },
    bottomLine: {
      color: parseColor(customStyle.bottomLine?.color) ?? defaultStyleConfig.bottomLine.color,
      linewidth: customStyle.bottomLine?.linewidth ?? defaultStyleConfig.bottomLine.linewidth,
    },
    material: {
      color: parseColor(customStyle.material?.color) ?? defaultStyleConfig.material.color,
      transparent: customStyle.material?.transparent ?? defaultStyleConfig.material.transparent,
      opacity: customStyle.material?.opacity ?? defaultStyleConfig.material.opacity,
      emissive: parseColor(customStyle.material?.emissive) ?? defaultStyleConfig.material.emissive,
      emissiveIntensity: customStyle.material?.emissiveIntensity ?? defaultStyleConfig.material.emissiveIntensity,
      shininess: customStyle.material?.shininess ?? defaultStyleConfig.material.shininess,
    },
    edges: {
      color: parseColor(customStyle.edges?.color) ?? defaultStyleConfig.edges.color,
      transparent: customStyle.edges?.transparent ?? defaultStyleConfig.edges.transparent,
      opacity: customStyle.edges?.opacity ?? defaultStyleConfig.edges.opacity,
    },
  };

  return processedStyle;
};

// 合并高亮配置
const mergeEmphasisConfig = (customEmphasis) => {
  if (!customEmphasis) return defaultEmphasisConfig;

  const processedEmphasis = {
    disabled: customEmphasis.disabled ?? defaultEmphasisConfig.disabled,
    targetZ: customEmphasis.targetZ ?? defaultEmphasisConfig.targetZ,
    itemStyle: {
      color: parseColor(customEmphasis.itemStyle?.color) ?? defaultEmphasisConfig.itemStyle.color,
      emissive: parseColor(customEmphasis.itemStyle?.emissive) ?? defaultEmphasisConfig.itemStyle.emissive,
      emissiveIntensity:
        customEmphasis.itemStyle?.emissiveIntensity ?? defaultEmphasisConfig.itemStyle.emissiveIntensity,
      opacity: customEmphasis.itemStyle?.opacity ?? defaultEmphasisConfig.itemStyle.opacity,
    },
  };

  return processedEmphasis;
};

// 应用控制器配置
const applyControlsConfig = (options) => {
  if (!controls) return;

  const { roam, rotate, scaleLimit } = options;

  // 处理 roam 配置（允许缩放和平移）
  if (roam !== undefined) {
    controls.enableZoom = roam;
    controls.enablePan = roam;
  }

  // 处理 rotate 配置（允许旋转）
  if (rotate !== undefined) {
    controls.enableRotate = rotate;
  }

  // 处理 scaleLimit 配置（缩放范围限制）
  if (scaleLimit) {
    const { min = 1, max = 5 } = scaleLimit;
    const currentDistance = camera.position.distanceTo(controls.target);
    controls.minDistance = currentDistance / max;
    controls.maxDistance = currentDistance / min;
  }

  controls.update();
};

// 设置地图参数
const setOptions = async (options) => {
  const { map, itemStyle, emphasis, series } = options;

  const styleConfig = mergeStyleConfig(itemStyle);
  const emphasisConfig = mergeEmphasisConfig(emphasis);

  // 保存高亮配置
  currentEmphasisConfig.value = emphasisConfig;

  const mapData = await loadMap(map);

  drawMap(mapData, styleConfig);
  applyControlsConfig(options);

  // 处理 series 配置
  if (series) {
    series.forEach((item) => {
      if (item.type === 'bar') {
        addBarCharts(item);
      }
    });
  }
};

onMounted(() => {
  initThree();
});

defineExpose({
  setOptions,
});
</script>
<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;

  :deep(.bar-label) {
    pointer-events: none;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
}
</style>
