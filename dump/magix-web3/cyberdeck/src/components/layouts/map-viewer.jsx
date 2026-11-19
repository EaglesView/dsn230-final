import Header from "../game/header";
import Map3DDev from "../game/map/map-dev";

const MapViewerLayout = () => {
  return (
    <div className="font-mono text-4xl bg-background w-screen h-screen flex flex-col">
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <Map3DDev
          isInteractive={true}
          showCameraInfo={true}
          enablePointerEvents={true}
        />

        <div className="absolute angled-tab-right-b bottom-4 right-4 bg-background/90 border-2 border-primary z-50 p-4 font-mono text-sm text-primary pointer-events-none">
          <h3 className="text-lg font-bold mb-2">CONTROLS</h3>
          <p>LEFT CLICK + DRAG: Rotate</p>
          <p>RIGHT CLICK + DRAG: Pan</p>
          <p>SCROLL: Zoom</p>
        </div>
      </div>
    </div>
  );
};

export default MapViewerLayout;
