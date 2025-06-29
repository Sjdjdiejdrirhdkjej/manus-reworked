import React from 'react';

interface WelcomeScreenProps {
  onExampleClick: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onExampleClick }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-2">Welcome to Manus!</h1>
        <p className="text-lg mb-8 text-muted">Start by typing a message or choose an example:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onExampleClick("What is the capital of France?")}
            className="p-4 rounded-lg text-left bg-white border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <p className="font-semibold mb-1">Capital of France</p>
            <p className="text-sm text-muted">Find out the capital of France.</p>
          </button>
          <button
            onClick={() => onExampleClick("Tell me a joke.")}
            className="p-4 rounded-lg text-left bg-white border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <p className="font-semibold mb-1">Tell me a joke</p>
            <p className="text-sm text-muted">Ask Manus to tell you a joke.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;