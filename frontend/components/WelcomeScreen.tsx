import React from 'react';

interface WelcomeScreenProps {
  onExampleClick: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onExampleClick }) => {
  return (
    <div className="welcome-screen">
      <h2>Welcome to Manus!</h2>
      <p>Start by typing a message or choose an example:</p>
      <div className="example-prompts">
        <button onClick={() => onExampleClick("What is the capital of France?")}>Capital of France</button>
        <button onClick={() => onExampleClick("Tell me a joke.")}>Tell a joke</button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
