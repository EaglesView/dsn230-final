import { useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import mapModel from "../../../assets/models/cyberpunk_2077_night_city_3d_map.glb";
import { useEffect } from "react";
import { useState } from "react";
import { PRIMARY } from "../../../utils/utils";
import { Dialog, useDialog } from "../../ui/dialog";
import Button from "../../ui/button";
import arasakaLogo from "../../../assets/arasaka-vertical.png";

const Map3DDev = ({
  isInteractive = false, // Enable OrbitControls
  showCameraInfo = false, // Display camera overlay
  enablePointerEvents = false, // Remove pointer-events-none
}) => {
  const mountRef = useRef(null);

  //refs des objets THREE
  const camRef = useRef(null);
  const modelRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const lightRef = useRef(null);
  const animatorRef = useRef(null);
  const controlsRef = useRef(null);
  const targetSphereRef = useRef(null);

  //State des paramètres
  const [isActive, setIsActive] = useState(true);

  //State for camera data display
  const [cameraData, setCameraData] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });

  // State for saving positions
  const [savedPositions, setSavedPositions] = useState(() => {
    const saved = localStorage.getItem("map-camera-positions");
    return saved ? JSON.parse(saved) : {};
  });
  const [locationName, setLocationName] = useState("");
  const [positionName, setPositionName] = useState("");

  // Dialog for errors
  const errorDialog = useDialog();
  const [errorMessage, setErrorMessage] = useState("");

  // Dialog for overwrite confirmation
  const confirmDialog = useDialog();
  const [pendingPosition, setPendingPosition] = useState(null);

  // Welcome dialog
  const welcomeDialog = useDialog();

  // Show welcome dialog on mount (only in interactive mode)
  useEffect(() => {
    if (isInteractive && showCameraInfo) {
      welcomeDialog.open();
    }
  }, []); // Run once on mount

  // Function to actually save the position
  const doSavePosition = (locName, posName) => {
    const target = {
      x: Math.round(controlsRef.current.target.x),
      y: Math.round(controlsRef.current.target.y),
      z: Math.round(controlsRef.current.target.z),
    };

    const newPositions = { ...savedPositions };
    if (!newPositions[locName]) {
      newPositions[locName] = {};
    }
    newPositions[locName][posName] = {
      position: cameraData.position,
      target: target,
    };

    setSavedPositions(newPositions);
    localStorage.setItem("map-camera-positions", JSON.stringify(newPositions));
    console.log("Position saved successfully:", locName, posName);
  };

  // Function to save current position
  const savePosition = () => {
    console.log("savePosition called", {
      locationName,
      positionName,
      hasControls: !!controlsRef.current,
    });

    if (!locationName || !positionName || !controlsRef.current) {
      console.log("Validation failed");
      setErrorMessage("Please enter both location and position names");
      errorDialog.open();
      return;
    }

    // Check if position already exists
    if (savedPositions[locationName]?.[positionName]) {
      setPendingPosition({ location: locationName, position: positionName });
      confirmDialog.open();
      return;
    }

    // Save directly if new
    doSavePosition(locationName, positionName);
  };

  // Confirm overwrite
  const handleConfirmOverwrite = () => {
    if (pendingPosition) {
      doSavePosition(pendingPosition.location, pendingPosition.position);
      setPendingPosition(null);
    }
  };

  // Calculate total positions count
  const getTotalPositionsCount = () => {
    return Object.values(savedPositions).reduce((total, location) => {
      return total + Object.keys(location).length;
    }, 0);
  };

  // Function to download JSON
  const downloadJSON = () => {
    const dataStr = JSON.stringify(savedPositions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "camera-positions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  //States du jeu
  /**
   * Donnes la position selon le nom de l'endroit ou le jeu se diriges.
   * Les endroits permis sont:
   * - h10 - megabuilding h10
   * - citycenter - le parc au downtown
   * - dogtown - pres de la pyramide a dogtown
   * - casino - au casino au nord de la ville
   * - jig-jig street - dans japantown
   *
   */
  const [currentLocation, setCurrentLocation] = useState("h10");

  /**
   * Definis le point de camera choisi pour montrer se qui se passes sur scene!
   *
   */
  const [camPosition, setCamPosition] = useState({ h10_upview: [5, 5, 5] });

  // callback dinitialisation
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (!mountRef.current) return;

    const modelLoader = new GLTFLoader();
    let model = null;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    //setup de la camera
    const camera = new THREE.PerspectiveCamera(
      50, //fov
      16 / 9, //aspect ratio
      0.1, //near clip
      100000, //far clip
    );
    camera.position.set(18938, 2880, -12349);
    camRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;

    // Clear any existing canvases before appending new one
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Setup OrbitControls if in interactive mode
    let controls = null;
    if (isInteractive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 100; // Decreased from 1000 to allow closer zoom
      controls.maxDistance = 50000;
      controls.maxPolarAngle = Math.PI / 2;
      controlsRef.current = controls;

      // Create target sphere to visualize where camera is looking
      const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: PRIMARY,
        emissive: PRIMARY,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.8,
      });
      const targetSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      targetSphere.position.copy(controls.target);
      targetSphereRef.current = targetSphere;
      scene.add(targetSphere);
    } else {
      camera.lookAt(15000, 0, -13000); // Only set lookAt for fixed mode
    }

    const updateSize = () => {
      if (mountRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    const animate = () => {
      animatorRef.current = requestAnimationFrame(animate);

      // Update controls if in interactive mode
      if (controlsRef.current) {
        controlsRef.current.update();

        // Update target sphere position to follow controls.target
        if (targetSphereRef.current) {
          targetSphereRef.current.position.copy(controlsRef.current.target);
        }
      }

      // Update camera data for overlay
      if (showCameraInfo && camRef.current) {
        setCameraData({
          position: {
            x: Math.round(camRef.current.position.x),
            y: Math.round(camRef.current.position.y),
            z: Math.round(camRef.current.position.z),
          },
          rotation: {
            x: (camRef.current.rotation.x * (180 / Math.PI)).toFixed(2),
            y: (camRef.current.rotation.y * (180 / Math.PI)).toFixed(2),
            z: (camRef.current.rotation.z * (180 / Math.PI)).toFixed(2),
          },
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    //loader la map 3D dans le component
    modelLoader.load(
      mapModel,
      function (gltf) {
        model = gltf.scene;
        modelRef.current = model;
        //Le rendre tres petit pour linstant
        model.scale.set(0.05, 0.05, 0.05);
        //utiliser traverse() pour:
        // - checker tout les mesh en loop
        model.traverse((subModel) => {
          // ces model la ont des wireframe dessus on veux pas ca dans le jeu
          if (
            subModel.name == "Material2_52" ||
            subModel.name == "Material3_10" ||
            subModel.name == "Material3_11"
          ) {
            subModel.isLine = false;
          }
          if (subModel.isMesh) {
            //changer la texture pour la couleur primaire

            // "material_0" contient la texture de minimap, on veux pas le sol!!
            if (subModel.material.name == "material_0") {
              subModel.material = new THREE.MeshStandardMaterial({
                color: PRIMARY,
                transparent: true,
                opacity: 0,
              });
            } else {
              subModel.material = new THREE.MeshStandardMaterial({
                color: PRIMARY,
                name: "cyberCoolPrimary",
                transparent: true,
                opacity: 0.6,
                vertexColors: false,
                emissive: false,
              });
            }
            subModel.geometry.deleteAttribute("color"); // Remove vertex colors
            subModel.geometry.computeVertexNormals(); // Recalculate normals
          }
        });

        scene.add(model);
      },
      undefined,
      function (error) {
        console.error("erreur de chargement d'asset,", error);
      },
    );
    return () => {
      window.removeEventListener("resize", updateSize);
      if (animatorRef.current) cancelAnimationFrame(animatorRef.current);
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (targetSphereRef.current) {
        scene.remove(targetSphereRef.current);
        targetSphereRef.current.geometry.dispose();
        targetSphereRef.current.material.dispose();
        targetSphereRef.current = null;
      }
      if (renderer) {
        renderer.dispose();
      }
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div>
      {isActive && (
        <div
          ref={mountRef}
          className={`w-full h-full z-10 relative ${
            enablePointerEvents ? "" : "pointer-events-none"
          }`}
        />
      )}
      {showCameraInfo && (
        <div className="absolute angled-tab-left-b top-4 left-4 font-mono text-xs text-primary z-20 pointer-events-none max-w-md">
          {/* Arasaka Logo */}
          <img
            src={arasakaLogo}
            alt="Arasaka"
            className="h-12 mb-2 opacity-80"
          />

          {/* Terminal Header */}
          <div className="mb-2 opacity-60">
            <p className="text-[10px]">ARASAKA SECURITY TERMINAL v4.2.1</p>
            <p className="text-[10px]">NIGHT CITY SURVEILLANCE GRID ACCESS</p>
            <p className="text-[10px]">
              USER: NETRUNNER_ANON | CLEARANCE: VIOLET
            </p>
            <p className="text-[10px]">{">"} CAMERA_POSITION_TRACKER.EXE</p>
            <p className="text-[10px] text-success">
              STATUS: ACTIVE | UPLINK: STABLE
            </p>
          </div>

          {/* Camera Data */}
          <div className="space-y-0.5 mb-3 opacity-90">
            <p className="text-success">[POSITION_VECTOR]</p>
            <p className="pl-2">
              X: {cameraData.position.x} | Y: {cameraData.position.y} | Z:{" "}
              {cameraData.position.z}
            </p>
            <p className="text-success pt-1">[ROTATION_EULER]</p>
            <p className="pl-2">
              X: {cameraData.rotation.x}° | Y: {cameraData.rotation.y}° | Z:{" "}
              {cameraData.rotation.z}°
            </p>
          </div>

          {/* Action Button */}
          <div className="pointer-events-auto mb-3">
            <Button
              variant="tech"
              className="w-full"
              onClick={() => {
                const target = controlsRef.current
                  ? {
                      x: Math.round(controlsRef.current.target.x),
                      y: Math.round(controlsRef.current.target.y),
                      z: Math.round(controlsRef.current.target.z),
                    }
                  : null;

                console.log("Camera Data:", {
                  position: cameraData.position,
                  target: target,
                  rotation: cameraData.rotation,
                });

                console.log("\nTo restore this view:");
                console.log(
                  `camera.position.set(${cameraData.position.x}, ${cameraData.position.y}, ${cameraData.position.z});`,
                );
                if (target) {
                  console.log(
                    `controls.target.set(${target.x}, ${target.y}, ${target.z});`,
                  );
                  console.log(`controls.update();`);
                }
              }}
            >
              {">"} EXPORT TO CONSOLE
            </Button>
          </div>

          {/* Save Position Section */}
          <div className="pointer-events-auto">
            <p className="text-[10px] opacity-60 mb-2">
              {">"} POSITION_ARCHIVE_SYSTEM
            </p>
            <input
              type="text"
              list="locations"
              placeholder="[LOCATION_ID]"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-background/50 border border-primary/30 px-2 py-1 text-xs mb-2 text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
            />
            <datalist id="locations">
              {Object.keys(savedPositions).map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            <input
              type="text"
              placeholder="[POSITION_NAME]"
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              className="w-full bg-background/50 border border-primary/30 px-2 py-1 text-xs mb-2 text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
            />
            <Button
              onClick={savePosition}
              variant="neomilitarism"
              className="w-full mb-2"
            >
              {">"} ARCHIVE POSITION
            </Button>
            <Button onClick={downloadJSON} variant="neutral" className="w-full">
              {">"} EXPORT DATA [{Object.keys(savedPositions).length}L/
              {getTotalPositionsCount()}P]
            </Button>
          </div>
        </div>
      )}

      <Dialog
        isOpen={errorDialog.isOpen}
        onClose={errorDialog.close}
        title="ERROR"
        type="ok"
        variant="neomilitarism"
      >
        {errorMessage}
      </Dialog>

      <Dialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.close}
        title="OVERWRITE POSITION"
        type="confirm"
        variant="neomilitarism"
        onConfirm={handleConfirmOverwrite}
        confirmText="OVERWRITE"
      >
        Position "{pendingPosition?.position}" already exists in location "
        {pendingPosition?.location}". Do you want to overwrite it?
      </Dialog>

      <Dialog
        isOpen={welcomeDialog.isOpen}
        onClose={welcomeDialog.close}
        title="UNAUTHORIZED ACCESS - GRANTED : SECRET DEV TOOL"
        type="ok"
        variant="neokitsch"
        confirmText="BREACH"
      >
        <div className="space-y-3">
          <p className="font-mono text-sm">
            Bienvenue dans l'outil de surveillance d'ARASAKA.
          </p>
          <p className="font-mono text-sm">
            Vous pouvez naviguer ce menu secret avec ces commandes:
          </p>
          <ul className="font-mono text-xs list-disc pl-5 space-y-1">
            <li>Clic Gauche : rotation de la caméra</li>
            <li>Clic droit : déplacement</li>
            <li>Molette de souris: Zoomer</li>
          </ul>
          <p className="font-mono text-sm pt-2">
            La petite sphère est le target de la caméra
          </p>
          <p className="font-mono text-sm max-w-xl">
            l'outil a été créé avec l'aide de l'IA, dans le simple but de tester
            plusieurs positions rapidement dans le projet. Cela m'a permis
            d'accélérer la partie superflue (minimap 3D) qui m'aurais pris un
            éternité sans l'aide d'outils comme un qui crée mon json de
            positions
          </p>
          <p className="font-mono text-sm max-w-xl pt-2 text-destructive">
            L'IA N'a pas été utilisé pour importer la carte, créer les
            orbitcontrols et afficher les valeurs de positions, il a accélérer
            le processus de création de positions, et a complètement stylé le
            component d'infos selon mes instructions.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
export default Map3DDev;
