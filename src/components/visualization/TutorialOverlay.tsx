import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Tutorial steps enum
export enum TutorialStep {
  INACTIVE = 0,
  GRAPH_INTRO = 1,
  NODE_SELECTION = 2,
  CENTRALITY_EXPLANATION = 3,
  CITATIONS_EXPLANATION = 4,
  INTERACTION_GUIDE = 5,
  COMPLETE = 6
}

// MODIFIED: Added 'interactive' property
interface TutorialConfig {
  targetSelector: string;
  title: string;
  content: string;
  showNext: boolean;
  position: 'center' | 'top' | 'right' | 'left' | 'bottom';
  highlightType: 'full' | 'element' | 'canvas';
  interactive?: boolean; // ADDED: To allow clicks on the highlighted element
}

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onClose: () => void;
  selectedNodeId: string | null;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ 
  step, 
  onNext, 
  onClose, 
  selectedNodeId 
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // No changes needed in getStepConfig, useEffect, or other helper functions
  const getStepConfig = (): TutorialConfig | null => {
switch (step) {
      case TutorialStep.GRAPH_INTRO:
        return {
          targetSelector: '#graph-visual-area',
          title: 'Interactieve Grafiek',
          content: 'Dit is een interactieve graaf die laat zien hoe dreigingen binnen en buiten verschillende categorieën met elkaar verbonden zijn. Door te scrollen kun je in- en uitzoomen, en door te klikken en slepen kun je de graaf verslepen.',
          showNext: true,
          position: 'center',
          highlightType: 'canvas',
          interactive: false, // Remains non-interactive
        };
      case TutorialStep.NODE_SELECTION:
        return {
          targetSelector: '#node-selector',
          title: 'Dreiging Selecteren',
          content: 'Selecteer nu een dreiging uit de lijst om meer informatie te bekijken. De lijst is klikbaar.',
          showNext: false,
          position: 'left',
          highlightType: 'element',
          interactive: true, // This is the only interactive step
        };
      case TutorialStep.CENTRALITY_EXPLANATION:
        return {
          targetSelector: '#centrality-info',
          title: 'Centraliteit',
          content: 'De verwevenheid van een dreiging wordt uitgedrukt door te kijken hoe centraal de knoop in het netwerk ligt. Dit geeft een indicatie van de invloed.',
          showNext: true,
          position: 'left',
          highlightType: 'element',
          interactive: false, // Remains non-interactive
        };
      case TutorialStep.CITATIONS_EXPLANATION:
        return {
          targetSelector: '#citations-container',
          title: 'Representatieve Citaten',
          content: 'Dit zijn representatieve citaten, geïdentificeerd door ons AI model. Je kunt hier op de titel klikken om het oorspronkelijke rapport te vinden.',
          showNext: true,
          position: 'left',
          highlightType: 'element',
          interactive: false, // Remains non-interactive
        };
      case TutorialStep.INTERACTION_GUIDE:
        return {
          targetSelector: '#graph-visual-area',
          title: 'Interactie Gids',
          content: 'Je kunt ook op knopen en verbindingen in de grafiek klikken voor meer informatie. Klik op een leeg gebied om de selectie te wissen en het netwerk te resetten.',
          showNext: true,
          position: 'center',
          highlightType: 'canvas',
          interactive: false, // Remains non-interactive
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    if (step !== TutorialStep.INACTIVE && step !== TutorialStep.COMPLETE) {
      setIsVisible(false);
      const updateElementRect = () => {
        const config = getStepConfig();
        if (!config) return;
        const element = document.querySelector(config.targetSelector);
        if (element) {
          setElementRect(element.getBoundingClientRect());
          setTimeout(() => setIsVisible(true), 50);
        } else {
          console.warn(`Tutorial target element not found: ${config.targetSelector}`);
          onClose();
        }
      };
      const timer = setTimeout(updateElementRect, 350);
      const handleResize = () => updateElementRect();
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setIsVisible(false);
    }
  }, [step]);

  if (step === TutorialStep.INACTIVE || step === TutorialStep.COMPLETE) return null;

  const config = getStepConfig();
  if (!config || !elementRect || elementRect.width === 0) return null;

  const canProceed = step !== TutorialStep.NODE_SELECTION || selectedNodeId !== null;

  const getHighlightStyle = () => {
    const padding = 10;
    return {
      left: elementRect.left - padding,
      top: elementRect.top - padding,
      width: elementRect.width + (padding * 2),
      height: elementRect.height + (padding * 2),
    };
  };
  
  const getCardPosition = () => {
      const cardWidth = 384;
      const cardHeight = 200;
      const margin = 24;
      const highlight = getHighlightStyle();
      switch (config.position) {
          case 'center': return { top: (window.innerHeight - cardHeight) / 2, left: (window.innerWidth - cardWidth) / 2 };
          case 'top': return { top: highlight.top - cardHeight - margin, left: highlight.left + (highlight.width - cardWidth) / 2 };
          case 'bottom': return { top: highlight.top + highlight.height + margin, left: highlight.left + (highlight.width - cardWidth) / 2 };
          case 'left': return { top: highlight.top + (highlight.height - cardHeight) / 2, left: highlight.left - cardWidth - margin };
          case 'right': return { top: highlight.top + (highlight.height - cardHeight) / 2, left: highlight.left + highlight.width + margin };
          default: return { top: 0, left: 0 };
      }
  };

  const highlightStyle = getHighlightStyle();
  const cardPosition = getCardPosition();
  const isInteractive = config.interactive === true;

  return (
    <>
      {/* MODIFICATION 1: 
        The SVG mask overlay is now used for ALL steps.
        We removed the ternary operator that showed a different overlay for non-interactive steps.
      */}
      {/* MODIFICATION 2: 
        The `pointer-events` class is now conditional.
        - 'pointer-events-none': Allows clicks to pass through (for interactive steps).
        - 'pointer-events-auto': Blocks clicks (for non-interactive steps).
      */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${isInteractive ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >
        <svg className="w-full h-full">
          <defs>
            <mask id="cutout-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={highlightStyle.left}
                y={highlightStyle.top}
                width={highlightStyle.width}
                height={highlightStyle.height}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#cutout-mask)"
          />
        </svg>
      </div>
      
      {/* This container for the border and card remains unchanged. It correctly sits on top and doesn't interfere with clicks. */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Highlighted area */}
        <div 
          className={`absolute border-4 border-orange-400 rounded-lg shadow-lg transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
          style={{
            ...highlightStyle,
            pointerEvents: 'none',
            animation: isVisible ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
        
        {/* Tutorial card */}
        <div 
          className={`absolute pointer-events-auto transition-all duration-300 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          style={{
            left: Math.max(16, Math.min(cardPosition.left, window.innerWidth - 384 - 16)),
            top: Math.max(16, Math.min(cardPosition.top, window.innerHeight - 200 - 16)),
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <Card className="p-6 max-w-md bg-white shadow-xl border-2 border-orange-400">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              {config.content}
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} size="sm">
                Overslaan
              </Button>
              {config.showNext && (
                <Button 
                  onClick={onNext} 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Volgende
                </Button>
              )}
              {isInteractive && !canProceed && (
                <Button 
                  disabled 
                  size="sm"
                  className="bg-gray-300"
                >
                  Selecteer eerst een dreiging
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// Hook for managing tutorial state (no changes needed here)
export const useTutorial = () => {
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(TutorialStep.INACTIVE);

  const startTutorial = () => {
    setTutorialStep(TutorialStep.GRAPH_INTRO);
  };

  const nextTutorialStep = () => {
    setTutorialStep(prev => (prev < TutorialStep.COMPLETE - 1 ? prev + 1 : TutorialStep.COMPLETE));
  };

  const closeTutorial = () => {
    setTutorialStep(TutorialStep.INACTIVE);
  };

  const autoAdvanceFromNodeSelection = (selectedNodeId: string | null) => {
    if (tutorialStep === TutorialStep.NODE_SELECTION && selectedNodeId) {
      setTimeout(() => {
        // Automatically move to the next step after a successful selection
        setTutorialStep(TutorialStep.CENTRALITY_EXPLANATION);
      }, 700); // A small delay to make the transition feel natural
    }
  };

  return {
    tutorialStep,
    startTutorial,
    nextTutorialStep,
    closeTutorial,
    autoAdvanceFromNodeSelection,
  };
};

export default TutorialOverlay;