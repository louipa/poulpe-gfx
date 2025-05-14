import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export default class EnvironmentManager {
  private onLoadCallback: ((envMap: THREE.Texture) => void) | null = null;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.setupLights(scene);
    this.loadHDRI(scene, renderer);
  }

  private setupLights(scene: THREE.Scene): void {
    const pointLight = new THREE.PointLight(0xffffff, 10);
    pointLight.position.set(0.8, 2.4, 1.0);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);
  }

  private loadHDRI(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const loader = new RGBELoader();

    loader.load("/poulpe-gfx/sky.hdr", (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.background = envMap;
      scene.environment = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.3;

      if (this.onLoadCallback) {
        this.onLoadCallback(envMap);
      }
    });
  }

  public onEnvironmentLoaded(callback: (envMap: THREE.Texture) => void): void {
    this.onLoadCallback = callback;
  }
}
