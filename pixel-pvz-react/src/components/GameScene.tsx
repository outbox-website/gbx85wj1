import React, { useEffect, useRef, useState } from 'react';
import './GameScene.css';
import { GameEngine } from '../engine/GameEngine';
import { PlantType } from '../engine/types';

interface GameSceneProps {
  isActive: boolean;
  onExit: () => void;
}

const GameScene: React.FC<GameSceneProps> = ({ isActive, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [sun, setSun] = useState(150); // Default start sun, will be reset by engine
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showWaveText, setShowWaveText] = useState(false);

  // Initialize Engine
  useEffect(() => {
    if (isActive && canvasRef.current && !engineRef.current) {
      console.log("Initializing Game Engine...");
      engineRef.current = new GameEngine(
        canvasRef.current, 
        {
          onSunChange: setSun,
          onGameOver: () => setIsGameOver(true),
          onPlantPlaced: () => setSelectedPlant(null), // Clear selection when planted
          onWaveStart: () => {
              setShowWaveText(true);
              setTimeout(() => setShowWaveText(false), 4000);
          }
        }
      );
      engineRef.current.start();
    } else if (!isActive && engineRef.current) {
       // Cleanup when leaving scene
       engineRef.current.stop();
       engineRef.current = null;
       setIsGameOver(false);
       setSun(150);
       setSelectedPlant(null);
       setShowWaveText(false);
    }
  }, [isActive]);

  // Handle Plant Selection
  const handleSelectPlant = (type: PlantType) => {
     if (isGameOver || !engineRef.current) return;
     
     // Toggle deselect if clicking same plant
     if (selectedPlant === type) {
        setSelectedPlant(null);
        engineRef.current.setSelectedPlant(null);
        return;
     }

     const cost = engineRef.current.getPlantCost(type);
     if (sun >= cost) {
       setSelectedPlant(type);
       engineRef.current.setSelectedPlant(type);
     }
  };

  return (
    <div className={`scene ${isActive ? 'active' : 'hidden'}`} id="scene-game">
      <div id="game-wrapper">
        {/* HUD */}
        <div id="ui-header">
          <div className="sun-display">
            <span className="icon">☀️</span>
            <span id="sun-amount">{Math.floor(sun)}</span>
          </div>
          <button id="quit-btn" onClick={onExit}>EXIT</button>
        </div>
        
        <div id="game-canvas-container">
          <canvas ref={canvasRef} id="game-canvas"></canvas>
          
          {/* Sidebar / Plant Dock */}
          <div id="plant-dock">
             <PlantCard 
                type="sunflower" 
                cost={50} 
                currentSun={sun}
                isSelected={selectedPlant === 'sunflower'}
                onClick={() => handleSelectPlant('sunflower')}
             />
             <PlantCard 
                type="peashooter" 
                cost={100} 
                currentSun={sun}
                isSelected={selectedPlant === 'peashooter'}
                onClick={() => handleSelectPlant('peashooter')}
             />
             <PlantCard 
                type="wallnut" 
                cost={50} 
                currentSun={sun}
                isSelected={selectedPlant === 'wallnut'}
                onClick={() => handleSelectPlant('wallnut')}
             />
             <PlantCard 
                type="chomper" 
                cost={150} 
                currentSun={sun}
                isSelected={selectedPlant === 'chomper'}
                onClick={() => handleSelectPlant('chomper')}
             />
             <div className="dock-spacer"></div>
             <PlantCard 
                type="shovel" 
                cost={0} 
                currentSun={sun}
                isSelected={selectedPlant === 'shovel'}
                onClick={() => handleSelectPlant('shovel')}
             />
          </div>

          {/* Wave Text Overlay */}
          {showWaveText && (
              <div className="wave-text-overlay">
                  <h1>A HUGE WAVE OF ZOMBIES IS APPROACHING!</h1>
              </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
             <div className="game-over-overlay">
                <h1>GAME OVER</h1>
                <button onClick={onExit}>BACK TO MENU</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Component for Cards
const PlantCard = ({ type, cost, currentSun, isSelected, onClick }: any) => {
   const isDisabled = currentSun < cost;
   return (
      <div 
        className={`card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`} 
        onClick={!isDisabled ? onClick : undefined}
      >
          <div className={`preview p-${type}`}></div>
          <div className="card-info">
              <span className="name">{type.slice(0,3)}</span>
              <span className="price">{cost}</span>
          </div>
      </div>
   )
}

export default GameScene;
