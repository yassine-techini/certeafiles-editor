/**
 * HomePage - Landing page with document examples for medical device certification
 */
import { Link } from 'react-router-dom';
import {
  Award,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Shield,
  Stethoscope,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Users,
  FileSearch,
  Zap,
} from 'lucide-react';
import { DOCUMENT_TEMPLATES } from '../data/sampleDocuments';

/**
 * Icon mapping for document types
 */
const ICON_MAP: Record<string, React.ReactNode> = {
  Award: <Award className="w-8 h-8" />,
  ClipboardCheck: <ClipboardCheck className="w-8 h-8" />,
  AlertTriangle: <AlertTriangle className="w-8 h-8" />,
  FileText: <FileText className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Stethoscope: <Stethoscope className="w-8 h-8" />,
};

/**
 * Feature card component
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

/**
 * Document card component
 */
function DocumentCard({
  id,
  title,
  description,
  category,
  icon,
  color,
}: {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}) {
  return (
    <Link
      to={`/document/${id}`}
      className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {ICON_MAP[icon]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {category}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        <ArrowRight
          className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0"
        />
      </div>
    </Link>
  );
}

/**
 * Stats component
 */
function Stats() {
  const stats = [
    { value: '50+', label: 'Modèles de documents' },
    { value: 'MDR', label: 'Conforme 2017/745' },
    { value: 'ISO', label: '13485 & 14971' },
    { value: '100%', label: 'Traçabilité' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
        >
          <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * HomePage component
 */
export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">CerteaFiles</h1>
                <p className="text-xs text-gray-500">Certification Documentation Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#documents" className="text-sm text-gray-600 hover:text-gray-900">
                Documents
              </a>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                Fonctionnalités
              </a>
              <Link
                to="/playground"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Playground
              </Link>
              <Link
                to="/editor"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Ouvrir l'éditeur
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Plateforme de certification médicale
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Documentation pour la
              <span className="text-blue-600"> certification </span>
              de dispositifs médicaux
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Créez, gérez et validez tous vos documents de certification conformément au
              Règlement (UE) 2017/745 (MDR) et aux normes ISO 13485 et ISO 14971.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/editor"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Essayer l'éditeur
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#documents"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Voir les exemples
              </a>
            </div>
          </div>

          <Stats />
        </div>
      </section>

      {/* Documents Section */}
      <section id="documents" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Exemples de documents
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explorez nos modèles de documents pré-configurés pour la certification de
              dispositifs médicaux. Chaque modèle est conforme aux exigences réglementaires.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOCUMENT_TEMPLATES.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                description={doc.description}
                category={doc.category}
                icon={doc.icon}
                color={doc.color}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
            >
              Créer un document personnalisé
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalités de l'éditeur
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un éditeur puissant conçu spécifiquement pour les besoins de la documentation
              de certification médicale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="Track Changes"
              description="Suivez toutes les modifications avec historique complet et approbation multi-niveaux."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Collaboration"
              description="Travaillez en temps réel avec votre équipe, commentaires et mentions intégrés."
            />
            <FeatureCard
              icon={<FileSearch className="w-6 h-6" />}
              title="Champs dynamiques"
              description="Variables et slots pour la génération automatique de documents."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Export PDF/DOCX"
              description="Exportez vos documents dans des formats conformes aux exigences réglementaires."
            />
          </div>
        </div>
      </section>

      {/* API/Playground Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Intégrez l'éditeur dans vos projets
                </h2>
                <p className="text-indigo-100 mb-6">
                  Explorez notre Playground avec la documentation complète de l'API.
                  Testez toutes les fonctionnalités et découvrez comment intégrer
                  l'éditeur CerteaFiles dans vos applications.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link
                    to="/playground"
                    className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
                  >
                    Ouvrir le Playground
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 font-mono text-sm text-indigo-100">
                  <div className="text-indigo-400">// Installation</div>
                  <div className="mt-1">npm install certeafiles-editor</div>
                  <div className="mt-3 text-indigo-400">// Usage</div>
                  <div className="mt-1 text-purple-300">{"import { CerteafilesEditor }"}</div>
                  <div className="text-purple-300">{"  from 'certeafiles-editor'"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à simplifier votre documentation de certification ?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Commencez dès maintenant avec notre éditeur gratuit et découvrez comment
              CerteaFiles peut accélérer votre processus de certification.
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              Démarrer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">CerteaFiles</span>
            </div>
            <p className="text-sm text-gray-500">
              Plateforme de documentation pour la certification de dispositifs médicaux
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>MDR 2017/745</span>
              <span>•</span>
              <span>ISO 13485</span>
              <span>•</span>
              <span>ISO 14971</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
