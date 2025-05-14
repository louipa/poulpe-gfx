import * as THREE from "three";
import {
  Scene,
  WebGLRenderer,
  Vector2,
  Vector3,
  PerspectiveCamera,
  BoxGeometry,
} from "three";
import BoatManager from "./boat";
import FishManager from "./fish";
import ObstacleManager from "./obstacles";
import AudioManager from "./audio";

export default class UnderwaterEffect {
  private scene: Scene;
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private underwaterMaterial: THREE.ShaderMaterial;
  private underwaterBox: THREE.Mesh;
  private boatManager: BoatManager;
  private fishManager: FishManager;
  private obstacleManager: ObstacleManager;
  private audioManager: AudioManager;
  private isUnderwater: boolean = false;

  constructor(
    scene: Scene,
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    boatManager: BoatManager,
    fishManager: FishManager,
    obstacleManager: ObstacleManager
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.boatManager = boatManager;
    this.fishManager = fishManager;
    this.obstacleManager = obstacleManager;
    this.audioManager = new AudioManager(camera);

    this.underwaterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        waterLevel: { value: 0.0 },
        cameraPosition: { value: new Vector3() },
        tDiffuse: { value: null },
        aberration: { value: 0.02 },
        causticsIntensity: { value: 0.5 },
        isUnderwater: { value: false },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vWorldPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec4 iMouse;
      uniform bool isUnderwater;
      varying vec3 vWorldPosition;

      vec3 col_water = vec3(.3, .7, 1.);
      float t = 20.;

      float maxdist = 5.;
      float det = .001;

      mat2 rot2D(float a) {
        a = radians(a);
        float s = sin(a);
        float c = cos(a);
        return mat2(c, s, -s, c);
      }

      mat3 lookat(vec3 fw, vec3 up) {
        fw = normalize(fw);
        vec3 rt = normalize(cross(fw, normalize(up)));
        return mat3(rt, cross(rt, fw), fw);
      }

      float fmod(float p, float c) { return abs(c - mod(p, c * 2.)) / c; }

      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      float smax(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      float fractal(vec3 p, float time) {
        p += cos(p.z * 3. + time * 4.) * .02;
        float depth = smoothstep(0., 6., -p.z + 5.);
        p *= .3;
        p = abs(2. - mod(p + vec3(0.4, 0.7, time * .07), 4.));
        float ls = 0.;
        float c = 0.;
        for (int i = 0; i < 6; i++) {
          p = abs(p) / min(dot(p, p), 1.) - .9;
          float l = length(p);
          c += abs(l - ls);
          ls = l;
        }
        return .15 + smoothstep(0., 50., c) * depth * 4.;
      }

      vec3 march(vec3 from, vec3 dir, vec3 dir_light, float time) {
        vec3 odir = dir;
        vec3 p = from + dir * 2.;
        float fg = fractal(p + dir, time) * .55;
        vec3 col = vec3(0.);
        float totdist = 0.;
        float d;
        float v = 0.;
        
        float fade = smoothstep(maxdist * .2, maxdist * .9, maxdist - totdist);
        float ref = 1.;
        if (d < det * 2.) {
          p -= (det - d) * dir;
          col = mix(col_water * .15, col, fade);
        }
        col *= normalize(col_water + 1.5) * 1.7;
        p = maxdist * dir;
        vec3 bk = fractal(p, time) * ref * col_water;
        float glow = pow(max(0., dot(dir, -dir_light)), 1.5);
        vec3 glow_water = normalize(col_water+1.);
        bk += glow_water*(glow+ pow(glow, 8.) * 1.5) * ref;
        col += v * .06 * glow * ref * glow_water;
        col += bk + fg * col_water;
        return col;
      }

      void main() {
        if (!isUnderwater) {
          gl_FragColor = vec4(0.0);
          return;
        }

        float time = mod(iTime, 600.);
        vec3 dir_light = normalize(vec3(-.3, 0.2, 1.));

        vec3 dir = normalize(vWorldPosition);
        vec3 from = vec3(0.0, 0.0, 0.0);

        vec3 col = march(from, dir, dir_light, time);
        col *= vec3(1.1, .9, .8);

        gl_FragColor = vec4(col, 1.0);
      }
      `,
      transparent: true,
      side: THREE.BackSide,
    });

    const geometry = new BoxGeometry(1000, 1000, 1000);
    this.underwaterBox = new THREE.Mesh(geometry, this.underwaterMaterial);
    this.scene.add(this.underwaterBox);
  }

  public update(delta: number): void {
    this.underwaterMaterial.uniforms.iTime.value += delta;
    this.underwaterMaterial.uniforms.cameraPosition.value.copy(
      this.camera.position
    );
    const lastState = this.isUnderwater;
    this.isUnderwater = this.camera.position.y < 0.0;
    this.underwaterMaterial.uniforms.isUnderwater.value = this.isUnderwater;
    this.audioManager.setUnderwater(this.isUnderwater);
    this.audioManager.update(delta);

    if (lastState !== this.isUnderwater) {
      this.boatManager.setVisible(!this.isUnderwater);
      this.fishManager.setVisible(!this.isUnderwater);
      this.obstacleManager.setVisible(!this.isUnderwater);
    }
  }

  public render(scene: Scene, camera: THREE.Camera): void {
    this.renderer.clear();
    this.renderer.render(scene, camera);

    if (this.isUnderwater) {
      const renderTarget = this.renderer.getRenderTarget();
      if (renderTarget) {
        this.underwaterMaterial.uniforms.tDiffuse.value = renderTarget.texture;
        this.renderer.render(this.underwaterBox, camera);
      }
    }
  }
}
