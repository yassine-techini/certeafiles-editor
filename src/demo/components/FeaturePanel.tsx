/**
 * FeaturePanel - Right sidebar showing feature demos
 */
import { useState } from 'react';
import {
  GitBranch,
  FileText,
  Download,
  Search,
  Users,
  ChevronRight,
  ChevronDown,
  Keyboard,
} from 'lucide-react';
import { ShortcutsDemo } from './features/ShortcutsDemo';
import { TrackChangesDemo } from './features/TrackChangesDemo';
import { SlotsDemo } from './features/SlotsDemo';
import { ExportDemo } from './features/ExportDemo';
import { QueryDemo } from './features/QueryDemo';
import { CollaborationDemo } from './features/CollaborationDemo';
import type { UseCollaborationReturn } from '../../hooks/useCollaboration';

type DemoSection = 'shortcuts' | 'trackchanges' | 'slots' | 'export' | 'query' | 'collaboration';

interface FeatureItem {
  id: DemoSection;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'shortcuts',
    title: 'Raccourcis',
    icon: <Keyboard size={16} />,
    description: '/, @, +, Ctrl+...',
  },
  {
    id: 'trackchanges',
    title: 'Track Changes',
    icon: <GitBranch size={16} />,
    description: 'Suivi des modifications',
  },
  {
    id: 'slots',
    title: 'Slots',
    icon: <FileText size={16} />,
    description: 'Contenus dynamiques',
  },
  {
    id: 'export',
    title: 'Export',
    icon: <Download size={16} />,
    description: 'PDF & DOCX',
  },
  {
    id: 'query',
    title: 'Query Builder',
    icon: <Search size={16} />,
    description: 'Requêtes visuelles',
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    icon: <Users size={16} />,
    description: 'Temps réel & présence',
  },
];

interface FeaturePanelProps {
  trackingEnabled: boolean;
  toggleTracking: () => void;
  collaboration: UseCollaborationReturn;
}

export function FeaturePanel({
  trackingEnabled,
  toggleTracking,
  collaboration,
}: FeaturePanelProps) {
  const [activeSection, setActiveSection] = useState<DemoSection>('shortcuts');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-12'
      }`}
    >
      {/* Panel Header */}
      <div className="h-12 border-b border-gray-200 flex items-center px-3 justify-between">
        {isExpanded && (
          <span className="font-semibold text-gray-700">Fonctionnalités</span>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isExpanded ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Feature Tabs */}
          <div className="grid grid-cols-3 gap-1 p-2 border-b border-gray-200">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveSection(feature.id)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors ${
                  activeSection === feature.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={feature.description}
              >
                {feature.icon}
                <span className="mt-1 truncate w-full text-center">
                  {feature.title}
                </span>
              </button>
            ))}
          </div>

          {/* Feature Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'shortcuts' && <ShortcutsDemo />}
            {activeSection === 'trackchanges' && (
              <TrackChangesDemo
                trackingEnabled={trackingEnabled}
                toggleTracking={toggleTracking}
              />
            )}
            {activeSection === 'slots' && <SlotsDemo />}
            {activeSection === 'export' && <ExportDemo />}
            {activeSection === 'query' && <QueryDemo />}
            {activeSection === 'collaboration' && (
              <CollaborationDemo collaboration={collaboration} />
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default FeaturePanel;
