import { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
interface WordPosition {
  x: number;
  y: number;
}

interface NeuralFiring {
  id: string;
  from: number;
  startTime: number;
  intensity: number;
}

const TransformerAttentionVisualizer = () => {
  // --- CONFIGURATION ---
  const brandColorRgb = "0, 153, 168";
  const letterSpeed = 100; // Speed for each letter (ms)
  const neuralFiringDuration = 800; // How long neural activity lasts
  const maxNeuralFirings = 8; // Maximum simultaneous neural activities
  const firingIntensity = 0.8; // Base intensity for neural firings

  // --- STATE AND REFS ---
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [cursorPosition, setCursorPosition] = useState<WordPosition>({ x: 0, y: 0 });
  const [neuralFirings, setNeuralFirings] = useState<NeuralFiring[]>([]);
  const [displayedText, setDisplayedText] = useState('o'); // Pre-generate first letter
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // --- STATIC CONTENT ---
  const highlightedSentence = "Door het bestaan van strategische afhankelijkheden, kunnen indirect ook mogelijkheden ontstaan voor economische dwang, ongewenste toegang tot kennis of informatie, spionage, of sabotage.";
  const targetSentence = "oorzaak: strategische afhankelijkheden, gevolg: spionage";
  const highlightedWords = highlightedSentence.split(' ');

  // --- EFFECTS ---

  // Intersection Observer Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.8, // Trigger when 80% of the component is visible
        rootMargin: '0px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Effect to calculate and update positions
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      const wordElements = containerRef.current.querySelectorAll('.word');
      const containerRect = containerRef.current.getBoundingClientRect();
      const positions = Array.from(wordElements).map(el => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        return {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });
      setWordPositions(positions);

      // Update cursor position
      if (cursorRef.current && isGenerating) {
        const cursorRect = cursorRef.current.getBoundingClientRect();
        setCursorPosition({
          x: cursorRect.left - containerRect.left + cursorRect.width / 2,
          y: cursorRect.top - containerRect.top + cursorRect.height / 2,
        });
      }
    };

    const timeoutId = setTimeout(updatePositions, 50);
    window.addEventListener('resize', updatePositions);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePositions);
    };
  }, [displayedText, isGenerating]);

  // Effect to start generation - now depends on isInView
  useEffect(() => {
    if (!isInView) return;

    const startTimer = setTimeout(() => {
      setIsGenerating(true);
    }, 1500);

    return () => clearTimeout(startTimer);
  }, [isInView]);

  // Effect for letter-by-letter generation
  useEffect(() => {
    if (!isGenerating || generationComplete) return;

    const generateNextLetter = () => {
      setDisplayedText(current => {
        if (current.length >= targetSentence.length) {
          setGenerationComplete(true);
          //setIsGenerating(false); // <-- REMOVED FROM HERE
          return current;
        }
        
        // Trigger neural firing before adding letter
        triggerNeuralFiring();
        
        return targetSentence.slice(0, current.length + 1);
      });
    };

    const timer = setTimeout(generateNextLetter, letterSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isGenerating, generationComplete, targetSentence, letterSpeed]);

  // Function to trigger neural firing
  const triggerNeuralFiring = useCallback(() => {
    if (wordPositions.length === 0) return;

    setNeuralFirings(current => {
      const now = Date.now();
      // Clean up expired firings
      const activeFirings = current.filter(
        firing => now < firing.startTime + neuralFiringDuration
      );

      // Add new firing if under limit
      if (activeFirings.length < maxNeuralFirings) {
        const newFiring: NeuralFiring = {
          id: `firing-${now}-${Math.random()}`,
          from: Math.floor(Math.random() * highlightedWords.length),
          startTime: now,
          intensity: firingIntensity + Math.random() * 0.4,
        };
        return [...activeFirings, newFiring];
      }
      
      return activeFirings;
    });
  }, [wordPositions.length, highlightedWords.length, neuralFiringDuration, maxNeuralFirings, firingIntensity]);

  // Effect for cleaning up neural firings
  useEffect(() => {
    if (!isGenerating) return;

    const cleanupInterval = setInterval(() => {
      setNeuralFirings(current => {
        const now = Date.now();
        return current.filter(firing => now < firing.startTime + neuralFiringDuration);
      });
    }, 100);

    return () => clearInterval(cleanupInterval);
  }, [isGenerating, neuralFiringDuration]);

  // Actions to perform when generation completes
  useEffect(() => {
    if (generationComplete) {
      setNeuralFirings([]);
      setIsGenerating(false); // <-- MOVED TO HERE: Reliably hide cursor
    }
  }, [generationComplete]);

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 h-48">
      <style>{`
        @keyframes neuralPulse {
          0% { 
            transform: scale(1);
            opacity: 0;
          }
          10% { 
            opacity: 1;
          }
          50% { 
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% { 
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        @keyframes synapseFlash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes letterAppear {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .neural-node {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
        }
        
        .synapse-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 153, 168, 0.6), transparent);
          pointer-events: none;
          transform-origin: left center;
        }
      `}</style>
      
      <div ref={containerRef} className="relative h-full">
        {/* Neural Activity Visualization */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {neuralFirings.map(firing => {
            const sourcePos = wordPositions[firing.from];
            if (!sourcePos || !cursorPosition) return null;

            const dx = cursorPosition.x - sourcePos.x;
            const dy = cursorPosition.y - sourcePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <div key={firing.id}>
                {/* Source neural node */}
                <div
                  className="neural-node"
                  style={{
                    left: sourcePos.x,
                    top: sourcePos.y,
                    background: `rgba(${brandColorRgb}, ${firing.intensity})`,
                    animation: `neuralPulse ${neuralFiringDuration / 1000}s ease-out forwards`,
                    boxShadow: `0 0 12px rgba(${brandColorRgb}, 0.6)`,
                  }}
                />
                
                {/* Synapse connection */}
                <div
                  className="synapse-line"
                  style={{
                    left: sourcePos.x,
                    top: sourcePos.y,
                    width: distance,
                    transform: `rotate(${angle}deg)`,
                    animation: `synapseFlash ${neuralFiringDuration / 1000}s ease-out forwards`,
                    animationDelay: '100ms',
                  }}
                />
                
                {/* Target neural node at cursor */}
                <div
                  className="neural-node"
                  style={{
                    left: cursorPosition.x,
                    top: cursorPosition.y,
                    background: `rgba(${brandColorRgb}, ${firing.intensity * 0.8})`,
                    animation: `neuralPulse ${neuralFiringDuration / 1000}s ease-out forwards`,
                    animationDelay: '150ms',
                    boxShadow: `0 0 15px rgba(${brandColorRgb}, 0.8)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="relative z-20 text-center h-full flex flex-col justify-center">
          {/* Highlighted sentence */}
          <div className="mb-6">
            <p className="text-lg leading-loose">
              {highlightedWords.map((word, index) => (
                <span
                  key={`highlight-${index}`}
                  className="word inline-block mx-0.5 px-1 py-0.5 text-slate-700 transition-all duration-300"
                  style={{
                    filter: neuralFirings.some(f => f.from === index) ? 'brightness(1.3)' : 'brightness(1)',
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          </div>

          {/* Generated text - Fixed height container */}
          <div className="h-12 flex items-center justify-center">
            <p className="text-lg leading-loose font-mono">
              {displayedText.split('').map((char, index) => (
                <span
                  key={`char-${index}`}
                  className="inline-block"
                  style={{
                    color: `rgb(${brandColorRgb})`,
                    opacity: isGenerating || generationComplete ? 1 : 0, // Hide until generation starts
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              {isGenerating && (
                <span 
                  ref={cursorRef}
                  className="inline-block w-0.5 h-5 ml-0.5"
                  style={{
                    backgroundColor: `rgb(${brandColorRgb})`,
                    animation: 'blink 1s infinite',
                  }}
                />
              )}
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TransformerAttentionVisualizer;