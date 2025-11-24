import React from 'react';
import './MenuScene.css';

interface MenuSceneProps {
  isActive: boolean;
  onStart: () => void;
}

const MenuScene: React.FC<MenuSceneProps> = ({ isActive, onStart }) => {
  return (
    <div className={`scene ${isActive ? 'active' : 'hidden'}`} id="scene-menu">
      <div className="menu-container">
        <div className="pixel-sun"></div>
        <h1 className="main-title">PIXEL<br/>GARDEN<br/>DEFENSE</h1>
        
        <div className="menu-decoration">
          <span className="deco-zombie">🧟</span>
          <span className="deco-plant">🌻</span>
        </div>
        
        <button 
          className="pixel-btn" 
          onClick={onStart}
        >
          PLAY GAME
        </button>
        
        <p className="version">v2.0.0 • React Edition</p>
      </div>
    </div>
  );
};

export default MenuScene;