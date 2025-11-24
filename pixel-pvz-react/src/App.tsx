import { useState } from 'react';
import MenuScene from './components/MenuScene';
import GameScene from './components/GameScene';

export type SceneType = 'menu' | 'game';

function App() {
  const [scene, setScene] = useState<SceneType>('menu');

  return (
    <>
      {/* Scene Manager: Controls which layer is active */}
      <MenuScene 
        isActive={scene === 'menu'} 
        onStart={() => setScene('game')} 
      />
      
      <GameScene 
        isActive={scene === 'game'} 
        onExit={() => setScene('menu')}
      />
    </>
  );
}

export default App;