<template>
  <div class="china-map" ref="chinaRef">
    <div class="control-panel">
      <button @click="toggleBarCharts" class="toggle-btn">
        {{ showBarCharts ? '隐藏柱状图' : '显示柱状图' }}
      </button>
      <button @click="toggleMap" class="toggle-btn map-toggle-btn">
        {{ currentMap === 'china' ? '切换到重庆' : '切换到中国' }}
      </button>
    </div>
  </div>
</template>
<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import chinaJson from './map/china.json';
import CQ from './map/chongqing.json';

const { proxy } = getCurrentInstance();

let scene, camera, renderer, controls, mapGroup;
let hoveredProvince = null; // 当前悬停的省份组
const animationSpeed = 0.15; // 动画速度
const showBarCharts = ref(true); // 控制柱状图显示
const currentMap = ref('china'); // 当前地图类型

// 地图数据配置
const mapConfigs = {
  china: {
    data: chinaJson,
    name: '中国地图',
    center: [104, 36], // 中心经纬度
    scale: 5, // 缩放比例
  },
  chongqing: {
    data: CQ,
    name: '重庆地图',
    center: [107.7, 30], // 重庆中心经纬度
    scale: 80, // 更大的缩放比例
  },
};

// 当前地图配置
let currentMapConfig = mapConfigs[currentMap.value];

// 计算地图边界
const calculateMapBounds = (mapData) => {
  let minLon = Infinity,
    maxLon = -Infinity;
  let minLat = Infinity,
    maxLat = -Infinity;

  mapData.features.forEach((feature) => {
    const { geometry } = feature;

    const processCoordinates = (coords) => {
      coords.forEach((coord) => {
        if (Array.isArray(coord[0])) {
          processCoordinates(coord);
        } else {
          const [lon, lat] = coord;
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      });
    };

    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => {
        processCoordinates(polygon);
      });
    } else if (geometry.type === 'Polygon') {
      processCoordinates(geometry.coordinates);
    }
  });

  return { minLon, maxLon, minLat, maxLat };
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
  // 目标是让地图在视口中占据约60-70%的空间
  const targetSize = 100; // 目标显示尺寸
  const scale = Math.min(targetSize / lonSpan, targetSize / latSpan);

  // 计算相机距离（基于缩放后的地图大小）
  const mapWidth = lonSpan * scale;
  const mapHeight = latSpan * scale;
  const maxDimension = Math.max(mapWidth, mapHeight);

  // 相机距离计算：确保整个地图可见
  // 使用视野角度(FOV)和地图尺寸计算合适的距离
  const fov = 70; // 与相机FOV一致
  const cameraDistance = (maxDimension / (2 * Math.tan((fov * Math.PI) / 360))) * 1.5;

  // 相机位置：稍微偏后和偏上，形成俯视角度
  const cameraY = -cameraDistance * 0.4; // 向后偏移
  const cameraZ = cameraDistance * 0.9; // 高度

  return {
    center: [centerLon, centerLat],
    scale: scale,
    cameraPosition: [0, cameraY, cameraZ],
    bounds: bounds,
  };
};

const customerData = [
  { name: '北京市', value: 100 },
  { name: '河北省', value: 60 },
  { name: '山西省', value: 40 },
  { name: '内蒙古', value: 20 },
  { name: '辽宁省', value: 60 },
  { name: '吉林省', value: 80 },
  { name: '黑龙江省', value: 60 },
  { name: '重庆市', value: 80 },
  { name: '甘肃省', value: 150 },
];

// 将经纬度转换为3D坐标
const projection = (coordinates) => {
  const [lon, lat] = coordinates;
  // 使用当前地图配置的中心点和缩放比例
  const [centerLon, centerLat] = currentMapConfig.center;
  const scale = currentMapConfig.scale;
  const x = (lon - centerLon) * scale;
  const y = (lat - centerLat) * scale;
  return [x, y];
};

// 绘制地图
const drawMap = (mapData) => {
  mapGroup = new THREE.Group();
  mapGroup.name = 'chinaMap';

  mapData.features.forEach((feature) => {
    const { properties, geometry } = feature;
    const { name, center, centroid } = properties;

    // 优先使用 center，如果没有则使用 centroid
    const centerCoord = center || centroid;

    // 处理MultiPolygon类型
    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          createProvince(ring, name, centerCoord);
        });
      });
    } else if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((ring) => {
        createProvince(ring, name, centerCoord);
      });
    }
  });

  scene.add(mapGroup);
};

// 创建省份
const createProvince = (coordinates, name, centerCoord) => {
  const depth = 5; // 增加拉伸高度，让3D效果更明显

  // 为每个省份创建一个组，方便整体移动
  const provinceGroup = new THREE.Group();
  provinceGroup.name = name + '_group';

  // 使用原始数据中的中心点坐标
  let centroid = null;
  if (centerCoord && centerCoord.length === 2) {
    centroid = projection(centerCoord);
  }

  provinceGroup.userData = {
    name,
    originalZ: 0,
    targetZ: 0,
    currentZ: 0,
    isHovered: false,
    centroid: centroid, // 存储中心坐标
  };

  // 创建边界线（顶部发光线）
  const linePoints = [];
  coordinates.forEach((coord) => {
    const [x, y] = projection(coord);
    linePoints.push(new THREE.Vector3(x, y, depth));
  });

  // 顶部发光边界线 - 增加线宽
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 3,
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = name + '_line';
  provinceGroup.add(line);

  // 底部边界线
  const bottomLinePoints = [];
  coordinates.forEach((coord) => {
    const [x, y] = projection(coord);
    bottomLinePoints.push(new THREE.Vector3(x, y, 0));
  });
  const bottomLineGeometry = new THREE.BufferGeometry().setFromPoints(bottomLinePoints);
  const bottomLineMaterial = new THREE.LineBasicMaterial({
    color: 0x004488,
    linewidth: 2,
  });
  const bottomLine = new THREE.Line(bottomLineGeometry, bottomLineMaterial);
  bottomLine.name = name + '_bottom_line';
  provinceGroup.add(bottomLine);

  // 创建3D拉伸面
  const shape = new THREE.Shape();
  coordinates.forEach((coord, index) => {
    const [x, y] = projection(coord);
    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });

  // 拉伸几何体
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // 渐变材质效果
  const material = new THREE.MeshPhongMaterial({
    color: 0x0066cc,
    transparent: true,
    opacity: 0.85,
    emissive: 0x002244,
    emissiveIntensity: 0.6,
    shininess: 100,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name + '_mesh';
  mesh.userData = { name, originalColor: 0x0066cc, originalEmissive: 0x002244 };
  provinceGroup.add(mesh);

  // 添加侧面发光效果
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.4,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.name = name + '_edges';
  provinceGroup.add(edges);

  // 将省份组添加到地图组
  mapGroup.add(provinceGroup);
};

// 添加柱状图
const addBarCharts = () => {
  customerData.forEach((data) => {
    const { name, value } = data;

    // 查找对应的省份组
    const provinceGroup = mapGroup.children.find((child) => child.name === name + '_group');

    if (provinceGroup && provinceGroup.userData.centroid) {
      // 使用预先计算好的质心坐标
      const [centerX, centerY] = provinceGroup.userData.centroid;

      // 柱状图高度根据数据值计算
      const barHeight = (value / 100) * 20; // 最大值100对应高度20
      const barWidth = 2;

      // 创建柱状图几何体
      const barGeometry = new THREE.BoxGeometry(barWidth, barWidth, barHeight);

      // 渐变色材质 - 根据数值大小改变颜色
      const colorValue = value / 100;
      const color = new THREE.Color().setHSL(0.6 - colorValue * 0.4, 1, 0.5); // 从青色到黄色

      const barMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100,
      });

      const bar = new THREE.Mesh(barGeometry, barMaterial);

      // 设置柱状图位置（在省份中心，z轴从5开始向上）
      bar.position.set(centerX, centerY, 5 + barHeight / 2);
      bar.name = name + '_bar';
      bar.userData = {
        name,
        value,
        originalColor: color.getHex(),
        baseX: centerX,
        baseY: centerY,
        baseZ: 5 + barHeight / 2,
        currentZ: 0,
        targetZ: 0,
      };

      // 添加柱状图边框
      const edgesGeometry = new THREE.EdgesGeometry(barGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.position.copy(bar.position);
      edges.name = name + '_bar_edges';
      edges.userData = {
        name,
        baseX: centerX,
        baseY: centerY,
        baseZ: 5 + barHeight / 2,
        currentZ: 0,
        targetZ: 0,
      };

      // 添加到场景
      scene.add(bar);
      scene.add(edges);

      // 添加数值标签（使用精灵）
      addValueLabel(centerX, centerY, 5 + barHeight + 2, value, name);
    }
  });
};

// 添加数值标签
const addValueLabel = (x, y, z, value, name) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 64;

  // 绘制文字
  context.fillStyle = '#ffffff';
  context.font = 'Bold 32px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(value.toString(), 64, 32);

  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(x, y, z);
  sprite.scale.set(4, 2, 1);
  sprite.name = name + '_label';
  sprite.userData = {
    name,
    baseX: x,
    baseY: y,
    baseZ: z,
    currentZ: 0,
    targetZ: 0,
  };

  scene.add(sprite);
  return sprite;
};

// 添加粒子光点效果
const addParticles = () => {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 500;
  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 180; // 扩大粒子范围
    posArray[i + 1] = (Math.random() - 0.5) * 140;
    posArray[i + 2] = Math.random() * 30;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.25, // 增大粒子尺寸
    color: 0x00ffff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  particlesMesh.name = 'particles';
  scene.add(particlesMesh);
};

// 初始化three
const initThree = () => {
  const w = proxy.$refs['chinaRef'].clientWidth;
  const h = proxy.$refs['chinaRef'].clientHeight;

  // 创建场景
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x000510);
  // 调整雾效范围
  // scene.fog = new THREE.Fog(0x000510, 80, 300);

  // 添加相机
  const k = w / h;
  camera = new THREE.PerspectiveCamera(70, k, 1, 1000); // 增大视野角度

  // 根据地图数据计算最佳视角
  const mapData = mapConfigs[currentMap.value].data;
  const optimalView = calculateOptimalView(mapData);

  // 更新当前地图配置
  currentMapConfig = {
    ...mapConfigs[currentMap.value],
    ...optimalView,
  };

  const [camX, camY, camZ] = currentMapConfig.cameraPosition;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  proxy.$refs['chinaRef']?.appendChild(renderer.domElement);

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 2); // 增强环境光
  scene.add(ambientLight);

  // 添加主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(80, 80, 80);
  scene.add(directionalLight);

  // 添加顶部聚光灯
  // const spotLight = new THREE.SpotLight(0x00ffff, 1.5);
  // spotLight.position.set(0, 0, 150);
  // spotLight.angle = Math.PI / 3;
  // spotLight.penumbra = 0.5;
  // spotLight.decay = 1.5;
  // spotLight.distance = 300;
  // scene.add(spotLight);

  // 添加底部光源
  // const bottomLight = new THREE.PointLight(0x0066ff, 1, 200);
  // bottomLight.position.set(0, 0, -20);
  // scene.add(bottomLight);

  // 设置相机控件
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 50; // 调整最小距离
  controls.maxDistance = 300; // 调整最大距离

  // 限制上下旋转角度（极角）
  controls.minPolarAngle = Math.PI / 2; // 最小角度
  controls.maxPolarAngle = Math.PI / 1.1; // 最大角度

  // 禁用左右旋转（方位角）
  controls.enableRotate = true; // 保持旋转功能开启
  controls.minAzimuthAngle = -Math.PI / 3;
  controls.maxAzimuthAngle = Math.PI / 3;

  // 绘制地图
  drawMap(currentMapConfig.data);

  // 添加柱状图
  addBarCharts();

  // 添加粒子效果
  addParticles();

  // 添加鼠标交互
  addMouseInteraction();

  // 动画循环
  animate();

  // 窗口大小调整
  window.addEventListener('resize', onWindowResize);
};

// 动画循环
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();

  // 地图缓慢旋转
  // if (mapGroup) {
  //   mapGroup.rotation.z += 0.0005;
  // }

  // 更新省份抽出动画
  if (mapGroup) {
    mapGroup.children.forEach((child) => {
      if (child.name.includes('_group') && child.userData) {
        const userData = child.userData;
        // 平滑过渡到目标位置
        if (Math.abs(userData.currentZ - userData.targetZ) > 0.01) {
          userData.currentZ += (userData.targetZ - userData.currentZ) * animationSpeed;
          child.position.z = userData.currentZ;
        }
      }
    });
  }

  // 更新柱状图和标签的抽出动画
  scene.children.forEach((child) => {
    if (child.userData && child.userData.name && (child.name.includes('_bar') || child.name.includes('_label'))) {
      const provinceName = child.userData.name;
      const provinceGroup = mapGroup?.children.find((pg) => pg.name === provinceName + '_group');

      if (provinceGroup && provinceGroup.userData) {
        // 同步省份的targetZ
        child.userData.targetZ = provinceGroup.userData.targetZ;

        // 平滑过渡
        if (Math.abs(child.userData.currentZ - child.userData.targetZ) > 0.01) {
          child.userData.currentZ += (child.userData.targetZ - child.userData.currentZ) * animationSpeed;
          child.position.z = child.userData.baseZ + child.userData.currentZ;
        }
      }
    }
  });

  // 粒子动画
  const particles = scene.getObjectByName('particles');
  if (particles) {
    particles.rotation.z += 0.0002;
    const positions = particles.geometry.attributes.position.array;
    for (let i = 2; i < positions.length; i += 3) {
      positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      if (positions[i] > 20) positions[i] = 0;
      if (positions[i] < 0) positions[i] = 20;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  // 柱状图呼吸动画和显示控制
  scene.children.forEach((child) => {
    if (child.name && (child.name.includes('_bar') || child.name.includes('_label'))) {
      // 控制显示/隐藏
      child.visible = showBarCharts.value;

      // 呼吸动画（仅对柱状图本身，不包括边框）
      if (child.name.includes('_bar') && !child.name.includes('_edges') && showBarCharts.value) {
        child.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.002) * 0.3;
      }
    }
  });

  renderer.render(scene, camera);
};

// 窗口大小调整
const onWindowResize = () => {
  const w = proxy.$refs['chinaRef'].clientWidth;
  const h = proxy.$refs['chinaRef'].clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};

// 鼠标交互
const addMouseInteraction = () => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  let lastHoveredProvinceName = null; // 记录上次悬停的省份名称

  const onMouseMove = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(mapGroup.children, true);

    let currentProvinceName = null;

    // 查找当前悬停的省份
    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData.name && object.name.includes('_mesh')) {
          currentProvinceName = object.userData.name;
          break;
        }
      }
    }

    // 只有当悬停的省份发生变化时才更新
    if (currentProvinceName !== lastHoveredProvinceName) {
      // 恢复之前高亮的对象
      if (hoveredMesh) {
        hoveredMesh.material.color.setHex(hoveredMesh.userData.originalColor);
        hoveredMesh.material.emissive.setHex(hoveredMesh.userData.originalEmissive);
        hoveredMesh.material.emissiveIntensity = 0.6;
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
            mesh.material.color.setHex(0x00ff88);
            mesh.material.emissive.setHex(0x00ff88);
            mesh.material.emissiveIntensity = 1.2;
          }

          // 抽出省份
          hoveredProvince = provinceGroup;
          provinceGroup.userData.targetZ = 3; // 抽出高度
          provinceGroup.userData.isHovered = true;
          renderer.domElement.style.cursor = 'pointer';
        }
      }

      lastHoveredProvinceName = currentProvinceName;
    }
  };

  const onClick = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(mapGroup.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object.userData.name) {
        console.log('点击了:', object.userData.name);
      }
    }
  };

  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onClick);
};

// 切换柱状图显示
const toggleBarCharts = () => {
  showBarCharts.value = !showBarCharts.value;
};

// 清除地图
const clearMap = () => {
  if (mapGroup) {
    // 移除地图组
    scene.remove(mapGroup);
    // 清理几何体和材质
    mapGroup.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    mapGroup = null;
  }

  // 清除柱状图和标签
  const objectsToRemove = [];
  scene.children.forEach((child) => {
    if (
      child.name &&
      (child.name.includes('_bar') || child.name.includes('_label') || child.name.includes('_bar_edges'))
    ) {
      objectsToRemove.push(child);
    }
  });

  objectsToRemove.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });

  // 重置悬停状态
  hoveredProvince = null;
};

// 切换地图
const toggleMap = () => {
  // 切换地图类型
  currentMap.value = currentMap.value === 'china' ? 'chongqing' : 'china';

  // 获取新地图数据并计算最佳视角
  const mapData = mapConfigs[currentMap.value].data;
  const optimalView = calculateOptimalView(mapData);

  // 更新当前地图配置
  currentMapConfig = {
    ...mapConfigs[currentMap.value],
    ...optimalView,
  };

  // 清除当前地图
  clearMap();

  // 更新相机位置（平滑过渡）
  const [camX, camY, camZ] = currentMapConfig.cameraPosition;

  // 使用动画过渡相机位置
  const startPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  const endPos = { x: camX, y: camY, z: camZ };

  let progress = 0;
  const duration = 1000; // 1秒过渡时间
  const startTime = Date.now();

  const animateCamera = () => {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);

    // 使用缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    camera.position.x = startPos.x + (endPos.x - startPos.x) * easeProgress;
    camera.position.y = startPos.y + (endPos.y - startPos.y) * easeProgress;
    camera.position.z = startPos.z + (endPos.z - startPos.z) * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      // 动画完成后重置控制器
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  animateCamera();

  // 绘制新地图
  drawMap(currentMapConfig.data);

  // 重新添加柱状图
  addBarCharts();

  console.log('切换到:', currentMapConfig.name, '视角参数:', {
    center: currentMapConfig.center,
    scale: currentMapConfig.scale.toFixed(2),
    cameraPosition: currentMapConfig.cameraPosition.map((v) => v.toFixed(2)),
  });
};

onMounted(() => {
  initThree();
  console.log('mapGroup', mapGroup);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (renderer) {
    renderer.dispose();
  }
});
</script>
<style lang="scss" scoped>
.china-map {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: translateY(0);
  }
}

.map-toggle-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);

  &:hover {
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
  }
}
</style>
