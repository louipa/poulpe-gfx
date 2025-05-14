import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private stats: Stats;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
    this.renderer = this.setupRenderer();
    this.controls = this.setupControls();
    this.clock = new THREE.Clock();
    this.stats = new Stats();
    this.setupEventListeners();
  }

  private setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0.8, 1.4, 1.0);
    return camera;
  }

  private setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
  }

  private setupControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.maxDistance = 50;
    controls.minDistance = 1;
    return controls;
  }

  private setupEventListeners(): void {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getClock(): THREE.Clock {
    return this.clock;
  }

  public update(): void {
    this.controls.update();
    this.stats.update();
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}

export default SceneManager;
