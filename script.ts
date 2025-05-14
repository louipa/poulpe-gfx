import SceneManager from "./src/scene";
import WaterManager from "./src/water";
import OctopusManager from "./src/octopus";
import EnvironmentManager from "./src/environment";
import FishManager from "./src/fish";
import UnderwaterEffect from "./src/underwater";
import BoatManager from "./src/boat";
import ObstacleManager from "./src/obstacles";

class Application {
  private sceneManager: SceneManager;
  private waterManager: WaterManager;
  private octopusManager: OctopusManager;
  private environmentManager: EnvironmentManager;
  private fishManager: FishManager;
  private underwaterEffect: UnderwaterEffect;
  private obstacleManager: ObstacleManager;
  private boatManager: BoatManager;

  constructor() {
    this.sceneManager = new SceneManager();
    this.waterManager = new WaterManager(this.sceneManager.getScene());
    this.obstacleManager = new ObstacleManager(this.sceneManager.getScene());
    this.octopusManager = new OctopusManager(this.sceneManager.getScene());
    this.environmentManager = new EnvironmentManager(
      this.sceneManager.getScene(),
      this.sceneManager.getRenderer()
    );
    this.boatManager = new BoatManager(
      this.sceneManager.getScene(),
      this.waterManager.getWater(),
      this.obstacleManager
    );

    this.environmentManager.onEnvironmentLoaded((envMap) => {
      this.fishManager = new FishManager(this.sceneManager.getScene(), envMap);
      this.underwaterEffect = new UnderwaterEffect(
        this.sceneManager.getScene(),
        this.sceneManager.getRenderer(),
        this.sceneManager.getCamera(),
        this.boatManager,
        this.fishManager,
        this.obstacleManager
      );
    });

    this.animate();
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.sceneManager.getClock().getDelta();

    this.sceneManager.update();
    this.waterManager.update(delta);
    this.octopusManager.update(delta);
    this.obstacleManager.update(delta);
    this.boatManager.update(delta);

    if (this.underwaterEffect) {
      this.underwaterEffect.update(delta);
      this.underwaterEffect.render(
        this.sceneManager.getScene(),
        this.sceneManager.getCamera()
      );
    }

    if (this.fishManager) {
      const tentaclePositions = this.octopusManager.getTentaclePositions();
      this.fishManager.update(delta, tentaclePositions);
      this.fishManager.setOctopusBox(this.octopusManager.getCollisionBox());
    }
  }
}

// init app
new Application();
