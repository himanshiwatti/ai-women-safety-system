import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SafeRouteMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time tracking state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [stats, setStats] = useState<{speed: number | null, heading: number | null, accuracy: number | null}>({ speed: 0, heading: 0, accuracy: 0 });
  const [error, setError] = useState<string | null>(null);
  
  // Refs to hold mutable state for D3 updates without re-rendering logic
  const startPosRef = useRef<{lat: number, lng: number} | null>(null);
  const userMarkerRef = useRef<d3.Selection<SVGCircleElement, unknown, null, undefined> | null>(null);
  const pulseRef = useRef<d3.Selection<SVGCircleElement, unknown, null, undefined> | null>(null);
  const mapConfigRef = useRef<{scale: number, startX: number, startY: number}>({ scale: 2.0, startX: 0, startY: 0 }); // Scale: pixels per meter

  // 1. Setup Geolocation Watcher & Wake Lock
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        
        // Initialize start position on first fix
        if (!startPosRef.current) {
          startPosRef.current = { lat: latitude, lng: longitude };
        }

        setLocation({ lat: latitude, lng: longitude });
        setStats({ speed, heading, accuracy });
        setError(null);
      },
      (err) => {
        console.warn("GPS Error:", err);
        setError("Weak GPS Signal");
      },
      options
    );

    // Request Wake Lock to keep screen on (simulating background active)
    let wakeLock: any = null;
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await (navigator as any).wakeLock.request('screen');
                console.log("Wake Lock active");
            }
        } catch (err) {
            console.log("Wake Lock request failed:", err);
        }
    };
    requestWakeLock();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // 2. Initialize Static Map (Runs once or on resize)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 300;
    const height = 300;
    
    // Store visual start point
    mapConfigRef.current.startX = width * 0.1;
    mapConfigRef.current.startY = height * 0.8;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // --- Static Layer ---

    // Mock Danger Zones
    const dangerZones = [
      { x: width * 0.2, y: height * 0.3, r: 60 }, 
      { x: width * 0.7, y: height * 0.7, r: 40 }, 
    ];

    // Mock Path Points
    const pathPoints = [
        { x: width * 0.1, y: height * 0.8 },
        { x: width * 0.3, y: height * 0.85 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.8, y: height * 0.2 },
    ];

    const defs = svg.append("defs");
    
    // Danger Gradient
    const gradient = defs.append("radialGradient").attr("id", "dangerGradient");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#D50000").attr("stop-opacity", 0.6);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#D50000").attr("stop-opacity", 0);

    // Draw Zones
    svg.selectAll("circle.danger")
        .data(dangerZones)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .style("fill", "url(#dangerGradient)");

    // Draw Path
    const lineGenerator = d3.line<{x: number, y: number}>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis);

    // Path Glow
    svg.append("path")
        .datum(pathPoints)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", "#FF4FF9")
        .attr("stroke-width", 8)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-linecap", "round");

    // Path Line
    svg.append("path")
        .datum(pathPoints)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");

    // Labels
    svg.append("text")
        .attr("x", width * 0.2)
        .attr("y", height * 0.3)
        .text("⚠️ High Risk Zone")
        .attr("text-anchor", "middle")
        .attr("fill", "#ffcccc")
        .attr("font-size", "10px")
        .attr("font-family", "Inter");

    // --- Dynamic Layer Setup ---
    
    // User Pulse
    pulseRef.current = svg.append("circle")
        .attr("cx", mapConfigRef.current.startX)
        .attr("cy", mapConfigRef.current.startY)
        .attr("r", 15)
        .attr("fill", "#6A0DAD")
        .attr("opacity", 0.3);

    // User Dot
    userMarkerRef.current = svg.append("circle")
        .attr("cx", mapConfigRef.current.startX)
        .attr("cy", mapConfigRef.current.startY)
        .attr("r", 6)
        .attr("fill", "#6A0DAD")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    // Pulse Animation
    const animatePulse = () => {
        pulseRef.current?.transition()
            .duration(1500)
            .attr("r", 25)
            .attr("opacity", 0)
            .on("end", function() {
                d3.select(this).attr("r", 6).attr("opacity", 0.5);
                animatePulse();
            });
    };
    animatePulse();

  }, []);

  // 3. Update User Position Visualization
  useEffect(() => {
    if (!location || !startPosRef.current || !userMarkerRef.current || !pulseRef.current) return;

    // Haversine approximation for small distances
    const R = 6371e3; // metres
    const lat1 = startPosRef.current.lat * Math.PI / 180;
    const lat2 = location.lat * Math.PI / 180;
    const dLat = (location.lat - startPosRef.current.lat) * Math.PI / 180;
    const dLon = (location.lng - startPosRef.current.lng) * Math.PI / 180;

    // Calculate displacement in meters (simplified flat projection for local movement)
    // x: East/West, y: North/South
    const dxMeters = dLon * R * Math.cos((lat1 + lat2)/2);
    const dyMeters = dLat * R; // Positive is North

    // Convert meters to pixels (Invert Y because screen Y is down)
    // Scale: e.g., 2 pixels per meter to make indoor walking visible
    const pixelDx = dxMeters * mapConfigRef.current.scale;
    const pixelDy = -dyMeters * mapConfigRef.current.scale;

    const newX = mapConfigRef.current.startX + pixelDx;
    const newY = mapConfigRef.current.startY + pixelDy;

    // Smooth transition to new position
    userMarkerRef.current.transition().duration(500).ease(d3.easeLinear)
        .attr("cx", newX)
        .attr("cy", newY);
    
    pulseRef.current.transition().duration(500).ease(d3.easeLinear)
        .attr("cx", newX)
        .attr("cy", newY);

  }, [location]);

  return (
    <div ref={containerRef} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg relative h-[300px]">
        {/* Map Overlays */}
        <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-accent flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE TRACKING
        </div>

        {error && (
             <div className="absolute top-2 right-2 z-10 bg-red-900/80 backdrop-blur px-2 py-1 rounded text-xs text-white">
                ! {error}
            </div>
        )}

        {/* Telemetry Panel */}
        <div className="absolute bottom-2 left-2 z-10 bg-black/40 backdrop-blur p-2 rounded border border-gray-700 w-[calc(100%-16px)]">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-[8px] text-gray-400 uppercase">LAT</div>
                    <div className="text-[10px] font-mono text-white">{location ? location.lat.toFixed(5) : '--'}</div>
                </div>
                <div>
                    <div className="text-[8px] text-gray-400 uppercase">LNG</div>
                    <div className="text-[10px] font-mono text-white">{location ? location.lng.toFixed(5) : '--'}</div>
                </div>
                <div>
                    <div className="text-[8px] text-gray-400 uppercase">SPD</div>
                    <div className="text-[10px] font-mono text-accent">
                        {stats.speed ? (stats.speed * 3.6).toFixed(1) + ' km/h' : '0.0'}
                    </div>
                </div>
            </div>
        </div>

        <svg ref={svgRef} className="w-full h-full bg-dark cursor-crosshair"></svg>
    </div>
  );
};

export default SafeRouteMap;