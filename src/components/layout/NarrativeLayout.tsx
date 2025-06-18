import { useState, useEffect, useMemo, useRef } from 'react';
import { MainContent } from '../visualization/MainContent';
import { ArrowUp, ChevronsDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import TransformerAttentionVisualizer from './TransformerAttentionVisualizer';
import ClimateImpactGraph from './ClimateImpactGraph';
import TraditionalRiskMatrix from './TraditionalRiskMatrix';
import { RelationGraphCanvas } from '../visualization/relationGraph/RelationGraphCanvas';

// --- Imports from MainContent (existing) ---
import type { Node, Edge } from '../visualization/networkGraph/networkService';
import { getNetworkWithCentralityMetrics } from '../visualization/networkGraph/networkService';
import { DEFAULT_THREAT_IMPACT_WEIGHTS, ThreatImpactWeights } from '../visualization/networkGraph/threatImpactService';
import { EdgeDisplayMode } from '../visualization/EdgeDisplayToggle';
import ScreenAlert from '../ui/ScreenAlert';

export type CentralityMetric =
  'eigen_centrality' |
  'eigen_centrality_in' |
  'eigen_centrality_out' |
  'cross_category_eigen_centrality' |
  'cross_category_eigen_centrality_in' |
  'cross_category_eigen_centrality_out';

const brandColorRgb = "0, 153, 168";

// Animation timing configuration
const ANIMATION_DURATION = 1000; // 1 second in milliseconds

const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// --- MODIFIED: Simplified and separated animations for the button ---
const buttonAnimations = `
  @keyframes buttonFadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 0.85; /* <-- CHANGED: Match the starting opacity of the glow animation */
      transform: translateY(0px);
    }
  }

  @keyframes subtleGlowPulse {
    0%, 100% { 
      opacity: 0.85; 
      filter: drop-shadow(0 0 2px rgba(${brandColorRgb}, 0.2));
    }
    50% { 
      opacity: 1; 
      filter: drop-shadow(0 0 8px rgba(${brandColorRgb}, 0.5));
    }
  }
`;

export const NarrativeLayout = () => {
  const introRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const basePath = import.meta.env.BASE_URL;

  // --- NEW: State for view tracking and controlled dialogs ---
  const [isMainContentVisible, setIsMainContentVisible] = useState(false);
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);

  // --- State and Data Fetching Logic (existing, unchanged) ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeDisplayMode, setEdgeDisplayMode] = useState<EdgeDisplayMode>('all');
  const [rawCountThreshold] = useState<number>(6);
  const [threatImpactWeights] = useState<ThreatImpactWeights>(DEFAULT_THREAT_IMPACT_WEIGHTS);
  const [mounted, setMounted] = useState(false);
  const [isFootnoteDialogOpen, setIsFootnoteDialogOpen] = useState(false);

  

  // --- NEW: Intersection Observer to track main content visibility ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainContentVisible(entry.isIntersecting);
      },
      {
        threshold: 0.5, // Triggers when 50% of the section is visible
      }
    );

    const currentRef = mainContentRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        setLoading(true);
        const data = await getNetworkWithCentralityMetrics(2, rawCountThreshold, threatImpactWeights);
        const validNodes = Array.isArray(data?.nodes) ? data.nodes : [];
        const validEdges = Array.isArray(data?.edges) ? data.edges : [];
        const filteredInitialEdges = validEdges.filter(edge => edge.weight >= 1);
        const nodeIdsWithValidEdges = new Set();
        filteredInitialEdges.forEach(edge => {
          nodeIdsWithValidEdges.add(edge.source);
          nodeIdsWithValidEdges.add(edge.target);
        });
        const filteredInitialNodes = validNodes.filter(node => nodeIdsWithValidEdges.has(node.id));
        setNodes(filteredInitialNodes);
        setEdges(filteredInitialEdges);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load network data');
        setLoading(false);
      }
    };
    loadNetworkData();
  }, [rawCountThreshold, threatImpactWeights]);

  const filteredEdges = useMemo(() => {
    if (edgeDisplayMode === 'all') return edges;
    if (selectedNodeId) {
      if (edgeDisplayMode === 'incoming') return edges.filter(e => e.target === selectedNodeId);
      if (edgeDisplayMode === 'outgoing') return edges.filter(e => e.source === selectedNodeId);
      return edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId);
    }
    return edges;
  }, [edges, edgeDisplayMode, selectedNodeId]);

  const filteredNodes = useMemo(() => {
    const nodeIdsWithEdges = new Set();
    filteredEdges.forEach(edge => {
      nodeIdsWithEdges.add(edge.source);
      nodeIdsWithEdges.add(edge.target);
    });
    return nodes.filter(node => nodeIdsWithEdges.has(node.id));
  }, [nodes, filteredEdges]);

  const handleScrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- NEW: Handler for the top-left button that changes function ---
  const handleTopLeftButtonClick = () => {
    if (isMainContentVisible) {
      handleScrollTo(introRef);
    } else {
      setIsLogoDialogOpen(true);
    }
  };

  const getAnimationStyle = (delay: number) => ({
    opacity: 0,
    animation: mounted ? `fadeIn ${ANIMATION_DURATION}ms ease-out forwards ${delay}ms` : 'none'
  });

  return (
    <div className="w-full h-screen overflow-y-scroll scroll-snap-type-y-mandatory">
      <style>{`
        ${fadeInAnimation}
        ${buttonAnimations}
      `}</style>
      <ScreenAlert />
      {/* --- MODIFIED: Header buttons with morphing behavior --- */}
      <div className="fixed top-4 left-4 md:top-8 md:left-8 z-50">
        <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl bg-white/95 backdrop-blur-sm p-0">
                <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-xl">Over het Rapport</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-4">
                <p className="text-gray-700 leading-relaxed text-left">
                    Dit analyse-instrument is ontwikkeld door <a href="https://denkwerk.online/" target="_blank" rel="noopener noreferrer" className="text-[rgb(0,153,168)] hover:underline">DenkWerk</a> in samenwerking met <a href="https://denkwerk.online/" target="_blank" rel="noopener noreferrer" className="text-[rgb(0,153,168)] hover:underline">KickstartAI</a> als onderdeel van het DenkWerk rapport 'Weerbaarheid by Design'.
                </p>
                <p className="text-gray-700 leading-relaxed text-left">
                    DenkWerk is een onafhankelijke denktank die met krachtige ideeën bijdraagt aan een welvarend, inclusief en vooruitstrevend Nederland.
                </p>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isFootnoteDialogOpen} onOpenChange={setIsFootnoteDialogOpen}>
    <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl bg-white/95 backdrop-blur-sm">
        <DialogHeader>
            <DialogTitle className="text-xl">Noot over AI-analyse</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-left">
                AI-modellen kunnen soms incorrecte verbanden identificeren tussen concepten. Om dit risico te beperken, worden alleen verbanden opgenomen die meerdere keren in verschillende bronnen voorkomen. Op deze website presenteren we de meest representatieve citaten per verband, maar we moedigen lezers aan om de originele bronnen te raadplegen om citaten in hun volledige context te begrijpen.
            </p>
        </div>
    </DialogContent>
</Dialog>
        
        {/* The single button that morphs its appearance and function */}
        <button
            onClick={handleTopLeftButtonClick}
            aria-label={isMainContentVisible ? "Terug naar uitleg" : "Open 'Over het Rapport' dialoog"}
            className={`
                group flex items-center justify-center h-14 md:h-16 bg-[rgb(0,153,168)] shadow-lg hover:scale-105
                transition-all duration-500 ease-in-out
                ${isMainContentVisible ? 'w-48 md:w-52 rounded-full px-4' : 'w-14 md:w-16 rounded-full'}
            `}
        >
            {/* Content for the "Back to Top" pill state */}
            <div className={`flex items-center space-x-2 md:space-x-3 transition-opacity duration-300 ${isMainContentVisible ? 'opacity-100' : 'opacity-0'}`}>
                <img
                    src={`${basePath}denkwerk_logo.svg`}
                    alt="Denkwerk Logo"
                    className="h-5 md:h-6 w-auto"
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
                <span className="text-white font-medium whitespace-nowrap text-sm md:text-base">Naar Uitleg</span>
                <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            
            {/* Content for the original logo circle state */}
            <div className={`absolute transition-opacity duration-300 ${isMainContentVisible ? 'opacity-0' : 'opacity-100'}`}>
                <img
                    src={`${basePath}denkwerk_logo.svg`}
                    alt="Denkwerk Logo"
                    className="h-7 md:h-8 w-auto"
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
            </div>
        </button>
      </div>

      {/* --- ENHANCED NARRATIVE SECTION --- */}
      <section
        ref={introRef}
        className="relative w-full h-screen bg-slate-50 scroll-snap-align-start overflow-hidden"
      >
        <div className="w-full h-full overflow-y-auto">
          <div className="relative w-full h-[200px] md:h-[250px] flex-shrink-0">
            <img
              src={`${basePath}nl_from_above.jpg`}
              alt="Netherlands by night"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
              Foto: ©ESA/NASA - André Kuipers
            </div>
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center text-white text-center px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={getAnimationStyle(0)}>
                Knooppuntenanalyse Dreigingen
              </h1>
              <p className="text-base md:text-lg max-w-3xl" style={getAnimationStyle(200)}>Een nieuw perspectief op de nationale veiligheid</p>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

              {/* Context Section */}
              <div className="relative pt-8" style={getAnimationStyle(600)}>
                <div className="flex items-center justify-center mb-8">
                  <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[rgb(0,153,168)] px-4 sm:px-6 text-center">Een veranderende wereld</h2>
                  <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                </div>
                 <div className="space-y-6 mb-12">
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left" style={getAnimationStyle(700)}>
               De uitdagingen waar Nederland voor staat zijn niet alleen groter, maar ook complexer en meer verweven dan we de afgelopen decennia gewend zijn. Dreigingen zijn geen op zichzelf staande incidenten meer, maar verweven ketens van oorzaak en gevolg. De wereld om ons heen verandert in hoog tempo: geopolitieke machtsverschuiving, klimaatdruk en de digitale revolutie.</p>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left" style={getAnimationStyle(800)}>
Deze trends maken dat <strong className="text-[rgb(0,153,168)]">dreigingen elkaar versterken en versnellen</strong>. Wat begint als een lokale storing, een cyberaanval, overstroming of handelsblokkade, kan uitgroeien tot een keten van afhankelijkheden. Een lokaal incident kan zich snel verspreiden en uitgroeien tot een crisis die meerdere sectoren raakt. De COVID-pandemie toonde dit pijnlijk aan: van gezondheidscrisis naar economische recessie, sociale spanningen en politieke polarisatie.                  </p>
                </div>
              </div>

              {/* Risk Analysis Section */}
              <div className="relative pt-8" style={getAnimationStyle(900)}>
                <div className="flex items-center justify-center mb-8">
                  <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[rgb(0,153,168)] px-4 sm:px-6 text-center">Van traditioneel naar nieuw denken</h2>
                  <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                </div>
                 <div className="space-y-6 mb-12">
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left" style={getAnimationStyle(1000)}>
De klassieke benadering van risico's kijkt naar waarschijnlijkheid en impact. Deze methode werkt goed voor losstaande dreigingen, maar in onze verweven wereld is een aanvullende dimensie nodig: <strong style={{ color: 'rgb(0, 153, 168)' }}>verwevenheid</strong>. Deze derde dimensie brengt in kaart hoe dreigingen elkaar beïnvloeden en versterken. Het gaat om het identificeren van knooppunten; dreigingen die als centrale schakels werken voor andere risico's. Door deze verbindingen systematisch te identificeren, kunnen we effectiever prioriteren.
                                </p>
                </div>
                <Card className="border border-gray-200/60 bg-white/50 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden" style={getAnimationStyle(1100)}>
                  <div className="p-4 sm:p-6 max-w-full overflow-x-auto">
                    <TraditionalRiskMatrix />
                  </div>
                  <div className="px-4 sm:px-6 pb-4 border-t border-gray-200/40">
                    <p className="text-sm text-gray-600 leading-relaxed pt-4 text-left">
                      De klassieke aanpak beoordeelt risico's individueel op kans en impact. <strong>Maar wat als een cyberaanval leidt tot energieuitval, die weer zorgt voor economische schade en sociale onrust?</strong> Deze ketens blijven in de traditionele benadering onzichtbaar. De nieuwe benadering voegt <strong>verwevenheid</strong> toe als derde dimensie.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Section: Verbanden tussen dreigingen */}
              <div className="relative pt-8 mt-12" style={getAnimationStyle(1200)}>
                <div className="flex items-center justify-center mb-8">
                    <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                    <h2 className="text-xl md:text-2xl font-semibold text-[rgb(0,153,168)] px-4 sm:px-6 text-center">Verbanden tussen dreigingen</h2>
                    <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                </div>
                <div className="space-y-6">
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left">
Om een netwerk van dreigingen te creëren, moeten we eerst de verbanden tussen dreigingen vaststellen. Gezien het dreigingslandschap breed is, is er niet een enkele expert die wij kunnen informeren over verbanden tussen allerlei dreigingen. Daarom richten wij ons op de 'wijsheid van de massa'. Met behulp van AI-taalmodellen (LLMs) hebben we duizenden beleidsdocumenten en onderzoeksrapporten geanalyseerd om de verborgen verbanden tussen diverse dreigingen bloot te leggen. Een taalmodel kan, zoals het onderstaande voorbeeld illustreert, de contextuele relaties identificeren die experts in de tekst leggen.                    </p>
                    <Card className="border border-gray-200/60 bg-white/50 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden">
                        <div className="p-4 sm:p-6">
                            <TransformerAttentionVisualizer />
                        </div>
                        <div className="px-4 sm:px-6 pb-4 border-t border-gray-200/40">
                            <p className="text-sm text-gray-600 leading-relaxed pt-4 font-medium text-left">
                                AI-taalmodellen kunnen contextuele relaties tussen concepten in tekst herkennen, waardoor we causale verbanden kunnen ontdekken die experts beschrijven.
                            </p>
                        </div>
                    </Card>
                </div>
              </div>
              
              {/* Section: Knooppunten identificeren */}
              <div className="relative pt-8">
                <div className="flex items-center justify-center mb-8">
                    <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                    <h2 className="text-xl md:text-2xl font-semibold text-[rgb(0,153,168)] px-4 sm:px-6 text-center">Knooppunten identificeren</h2>
                    <div className="flex-1 h-[1.5px] bg-gray-300"></div>
                </div>
                <div className="space-y-6">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left">
                Uit deze analyse zijn duizenden citaten verzameld die wijzen op causale verbanden. Deze verbanden vormen een netwerk waarin elke dreiging een knoop is. Om de betrouwbaarheid te waarborgen, negeren we verbanden die slechts sporadisch worden geïdentificeerd.<sup><button onClick={() => setIsFootnoteDialogOpen(true)} className="text-[rgb(0,153,168)] font-bold hover:underline">1</button></sup> Dit netwerk stelt ons in staat te identificeren welke dreigingen als centrale knooppunten functioneren, ofwel dreigingen die vele andere dreigingen beïnvloeden. Door ons te richten op dreigingen die keteneffecten kunnen veroorzaken, kunnen we effectiever prioriteiten stellen in ons nationaal veiligheidsbeleid.
                </p>                 
                <Card className="border border-gray-200/60 bg-white/50 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden">
                        <div className="p-4 sm:p-6">
                            <ClimateImpactGraph />
                        </div>
                         <div className="px-4 sm:px-6 pb-4 border-t border-gray-200/40">
                            <p className="text-sm text-gray-600 leading-relaxed pt-4 font-medium text-left">
                                Voorbeeld uit onze analyse: hitte en droogte fungeren als centrale dreiging met cascaderende effecten op landbouw, gezondheid, energie en economie.
                            </p>
                        </div>
                    </Card>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left">
De dreigingen in de visualisatie zijn verdeeld over zes categorieën (zoals economisch, ecologisch, technologisch & digitaal), met een <strong style={{ color: 'rgb(0, 153, 168)' }}>focus op de verbanden tussen deze categorieën</strong>. De dikte van een lijn geeft de geschatte impact van de gevolgdreiging aan. De grootte van het knooppunt representeert de invloed van een dreiging op andere categorieën.                    </p>
                    <Card className="border border-gray-200/60 bg-white/50 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden">
                        <div className="p-4 sm:p-6">
                            <RelationGraphCanvas nodes={filteredNodes} edges={filteredEdges} />
                        </div>
                        <div className="px-4 sm:px-6 pb-4 border-t border-gray-200/40">
                            <p className="text-sm text-gray-600 leading-relaxed pt-4 text-center font-medium">
                                Ontdek keteneffecten van verschillende dreigingen in het netwerk. <strong>Klik op een verbinding</strong> om de onderliggende citaten en brondocumenten te bekijken.
                            </p>
                        </div>
                    </Card>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed text-left">De visualisatie is interactief: <strong style={{ color: 'rgb(0, 153, 168)' }}>klik op een verbinding om de onderliggende citaten en brondocumenten te raadplegen.</strong> Voor een diepgaande blik en uitleg verwijzen we u naar ons <a href='https://google.com' target='_blank' rel='noopener noreferrer' style={{ color: 'rgb(0, 153, 168)', fontWeight: 'bold' }} className='underline'>rapport</a> en de bijbehorende <a href='https://google.com' target='_blank' rel='noopener noreferrer' style={{ color: 'rgb(0, 153, 168)', fontWeight: 'bold' }} className='underline'>appendix</a>.</p>

                {/* Footnote */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        <span className="text-[rgb(0,153,168)] font-bold">1</span> AI-modellen kunnen soms incorrecte verbanden identificeren tussen concepten. Om dit risico te beperken, worden alleen verbanden opgenomen die meerdere keren in verschillende bronnen voorkomen. Op deze website presenteren we de meest representatieve citaten per verband, maar we moedigen lezers aan om de originele bronnen te raadplegen om citaten in hun volledige context te begrijpen.
                    </p>
                </div>
                </div>
              </div>
              
              <div className="h-24"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => handleScrollTo(mainContentRef)}
            className="flex flex-col items-center text-gray-500 hover:text-[rgb(0,153,168)] transition-colors bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg"
            aria-label="Scroll to main content"
            style={{
              opacity: 0, // Start invisible, animation will take over
              animation: mounted 
                ? `buttonFadeIn 0.8s ease-out 1.2s forwards, subtleGlowPulse 3s ease-in-out 2s infinite` 
                : 'none',
            }}
          >
            <span className="mb-1 text-sm font-medium text-[rgb(0,153,168)]">Verken het Netwerk</span>
            <ChevronsDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* --- Section 2: Main Content (The Interactive Graph) --- */}
      <section
        ref={mainContentRef}
        className="relative w-full h-screen bg-gray-900 scroll-snap-align-start"
      >
        <MainContent
          nodes={nodes}
          loading={loading}
          error={error}
          filteredNodes={filteredNodes}
          filteredEdges={filteredEdges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          edgeDisplayMode={edgeDisplayMode}
          onSetEdgeDisplayMode={setEdgeDisplayMode}
        />
      </section>
      
      <style>{`
        .scroll-snap-type-y-mandatory { scroll-snap-type: y mandatory; }
        .scroll-snap-align-start { scroll-snap-align: start; }
        ${fadeInAnimation}
        ${buttonAnimations}
      `}</style>
    </div>
  );
};

export default NarrativeLayout;