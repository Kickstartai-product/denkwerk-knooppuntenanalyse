import { Button } from "@/components/ui/button";
import { ArrowRightFromLine, ArrowLeftToLine, MoveHorizontal } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type EdgeDisplayMode = 'all' | 'incoming' | 'outgoing';

interface EdgeDisplayToggleProps {
  displayMode: EdgeDisplayMode;
  setDisplayMode: (mode: EdgeDisplayMode) => void;
}

const EdgeDisplayToggle = ({ displayMode, setDisplayMode }: EdgeDisplayToggleProps) => {
  return (
    <div className="flex items-center bg-background/70 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={displayMode === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8 px-2 rounded-none"
              onClick={() => setDisplayMode('all')}
            >
              <MoveHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toon alle verbindingen</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={displayMode === 'incoming' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8 px-2 rounded-none border-l border-r border-border/30"
              onClick={() => setDisplayMode('incoming')}
            >
              <ArrowLeftToLine className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toon alleen inkomende verbindingen</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={displayMode === 'outgoing' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8 px-2 rounded-none"
              onClick={() => setDisplayMode('outgoing')}
            >
              <ArrowRightFromLine className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toon alleen uitgaande verbindingen</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default EdgeDisplayToggle;