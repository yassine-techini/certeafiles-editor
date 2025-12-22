/**
 * DocumentList - Home page showing all documents
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  FileText,
  Users,
  Trash2,
  Clock,
  Search,
  MoreVertical,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  useDocumentStore,
  type DocumentMetadata,
} from '../../stores/documentStore';

interface DocumentListProps {
  onCreateDocument: () => void;
  onOpenDocument: (id: string) => void;
}

export function DocumentList({ onCreateDocument, onOpenDocument }: DocumentListProps) {
  const documents = useDocumentStore((state) => state.getDocumentsList());
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [documents, searchQuery]);

  const handleCopyLink = async (doc: DocumentMetadata) => {
    const link = `${window.location.origin}/doc/${doc.id}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteDocument(id);
    }
    setMenuOpenFor(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "À l'instant" : `Il y a ${minutes} minutes`;
      }
      return hours === 1 ? 'Il y a 1 heure' : `Il y a ${hours} heures`;
    }
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">CerteaFiles Editor</h1>
                <p className="text-sm text-gray-500">Vos documents</p>
              </div>
            </div>

            <button
              onClick={onCreateDocument}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Nouveau document</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher des documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            {documents.length === 0 ? (
              <>
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-xl font-medium text-gray-700 mb-2">Aucun document</h2>
                <p className="text-gray-500 mb-6">
                  Créez votre premier document pour commencer
                </p>
                <button
                  onClick={onCreateDocument}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>Créer un document</span>
                </button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-xl font-medium text-gray-700 mb-2">Aucun résultat</h2>
                <p className="text-gray-500">
                  Aucun document ne correspond à votre recherche
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New Document Card */}
            <button
              onClick={onCreateDocument}
              className="group border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                <Plus className="text-gray-400 group-hover:text-blue-500" size={24} />
              </div>
              <span className="text-gray-500 group-hover:text-blue-600 font-medium">
                Nouveau document
              </span>
            </button>

            {/* Document Cards */}
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer relative"
                onClick={() => onOpenDocument(doc.id)}
              >
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b border-gray-100">
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="text-gray-300" size={48} />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{formatDate(doc.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenFor(menuOpenFor === doc.id ? null : doc.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenFor === doc.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              handleCopyLink(doc);
                              setMenuOpenFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {copiedId === doc.id ? (
                              <>
                                <span className="text-green-500">✓</span>
                                <span>Lien copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copier le lien</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              window.open(`/doc/${doc.id}`, '_blank');
                              setMenuOpenFor(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ExternalLink size={14} />
                            <span>Ouvrir dans un nouvel onglet</span>
                          </button>
                          <hr className="my-1 border-gray-200" />
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collaboration Badge */}
                  {doc.collaborationEnabled && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                      <Users size={12} />
                      <span>Collaboration</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Click outside to close menu */}
      {menuOpenFor && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenFor(null)}
        />
      )}
    </div>
  );
}

export default DocumentList;
