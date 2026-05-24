import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Edit,
  GitBranch,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import templateApi from '../api/templateApi';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/ui/Modal';

const Templates = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const organizationId = user?.organization?.id;

  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [templates, setTemplates] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [usingTemplateId, setUsingTemplateId] = React.useState(null);
  const [deletingTemplateId, setDeletingTemplateId] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [openMenuTemplateId, setOpenMenuTemplateId] = React.useState(null);
  const [templateToDelete, setTemplateToDelete] = React.useState(null);

  React.useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId) {
          setTemplates([]);
          setError('No organization found for current user.');
          return;
        }

        const data = await templateApi.getByOrganization(organizationId);
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load templates.');
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [organizationId]);

  React.useEffect(() => {
    const closeMenu = () => setOpenMenuTemplateId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const categories = React.useMemo(() => {
    const counts = templates.reduce((acc, template) => {
      const category = template.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'All', count: templates.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [templates]);

  const visibleTemplates = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory =
          selectedCategory === 'All' || template.category === selectedCategory;

      const matchesSearch =
          !query ||
          template.name?.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.category?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, search]);

  const handleUseTemplate = async (template) => {
    if (!user?.id) {
      setError('You must be logged in to use a template.');
      return;
    }

    if (!organizationId) {
      setError('No organization found for current user.');
      return;
    }

    try {
      setUsingTemplateId(template.id);
      setError(null);

      const workflow = await templateApi.use(template.id, {
        userId: user.id,
        organizationId,
        name: template.name,
      });

      navigate(`/workflow/${workflow.id}`);
    } catch (err) {
      setError(err.message || 'Failed to use template.');
    } finally {
      setUsingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    if (!organizationId) {
      setError('No organization found for current user.');
      return;
    }

    try {
      setDeletingTemplateId(templateToDelete.id);
      setError(null);

      await templateApi.deleteForOrganization(templateToDelete.id, organizationId);

      setTemplates((currentTemplates) =>
        currentTemplates.filter((item) => String(item.id) !== String(templateToDelete.id))
      );
      setTemplateToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete template.');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const toggleTemplateMenu = (event, templateId) => {
    event.stopPropagation();
    setOpenMenuTemplateId((currentId) =>
      String(currentId) === String(templateId) ? null : templateId
    );
  };

  const handleEditTemplate = (event, template) => {
    event.stopPropagation();
    setOpenMenuTemplateId(null);
    navigate(`/templates/edit/${template.id}`);
  };

  const handleMenuDeleteTemplate = (event, template) => {
    event.stopPropagation();
    setOpenMenuTemplateId(null);
    setTemplateToDelete(template);
  };

  return (
      <div className="space-y-5 font-urbanist">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#292D32]">Templates</h1>
            <p className="mt-1 text-sm text-[#5C5C5C]">
              Deploy pre-built enterprise blueprints for scalable automation programs.
            </p>
          </div>

          <button
              type="button"
              onClick={() => navigate('/templates/create')}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>

        <section className="enterprise-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#292D32]">Enterprise Template Library</h2>
              <p className="mt-1 text-sm text-[#5C5C5C]">
                Curated blueprints for branching logic, error handling, and governed data mapping patterns.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
                <p className="text-xl font-bold text-[#292D32]">{templates.length}</p>
                <p className="text-xs text-[#5C5C5C]">Templates</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
                <p className="text-xl font-bold text-[#292D32]">
                  {categories.length > 0 ? categories.length - 1 : 0}
                </p>
                <p className="text-xs text-[#5C5C5C]">Categories</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
                <p className="text-xl font-bold text-[#292D32]">
                  {templates.reduce(
                      (total, template) => total + (template.content?.nodes?.length || 0),
                      0
                  )}
                </p>
                <p className="text-xs text-[#5C5C5C]">Nodes</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
              <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={[
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    selectedCategory === category.name
                        ? 'border-[#292D32] bg-[#292D32] text-white'
                        : 'border-[#E2E8F0] bg-white text-[#5C5C5C] hover:border-[#D0FFA4]',
                  ].join(' ')}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-70">{category.count}</span>
              </button>
          ))}
        </div>

        {loading ? (
            <div className="enterprise-card p-5 text-sm text-[#5C5C5C]">
              Loading templates...
            </div>
        ) : null}

        {error ? (
            <div className="enterprise-card border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
        ) : null}

        {!loading && !error && visibleTemplates.length === 0 ? (
            <div className="enterprise-card p-5 text-sm text-[#5C5C5C]">
              No templates found.
            </div>
        ) : null}

        {!loading && !error && visibleTemplates.length > 0 ? (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTemplates.map((template) => (
                  <article key={template.id} className="enterprise-card p-5">
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
                        <Sparkles size={17} className="text-[#292D32]" />
                      </div>
                      <div className="relative flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D0FFA4] px-2 py-1 text-xs font-semibold text-[#292D32]">
                          <Star size={12} />
                          Ready
                        </span>
                        <button
                          type="button"
                          onClick={(event) => toggleTemplateMenu(event, template.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#292D32] hover:border-[#D0FFA4]"
                          aria-label="Template actions"
                          aria-haspopup="menu"
                          aria-expanded={String(openMenuTemplateId) === String(template.id)}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {String(openMenuTemplateId) === String(template.id) ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-lg"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(event) => handleEditTemplate(event, template)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#292D32] hover:bg-[#F6F8FA]"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(event) => handleMenuDeleteTemplate(event, template)}
                              disabled={deletingTemplateId === template.id}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-[#292D32]">
                      {template.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#5C5C5C]">
                      {template.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5C5C5C]">
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                  {template.category || 'Uncategorized'}
                </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                  <GitBranch size={12} />
                        {template.content?.nodes?.length || 0} nodes
                </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                  <Users size={12} />
                  Template
                </span>
                    </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                          onClick={() => handleUseTemplate(template)}
                          disabled={usingTemplateId === template.id}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
                      >
                        {usingTemplateId === template.id ? 'Creating...' : 'Use Template'}
                  <ArrowRight size={14} />
                </button>
              </div>
                  </article>
              ))}
            </section>
        ) : null}

        <Modal
          isOpen={Boolean(templateToDelete)}
          onClose={() => setTemplateToDelete(null)}
          title="Delete Template"
        >
          <p className="mb-5 text-sm text-[#5C5C5C]">
            Delete <strong className="text-[#292D32]">{templateToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTemplateToDelete(null)}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTemplate}
              disabled={deletingTemplateId === templateToDelete?.id}
              className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-60"
            >
              {deletingTemplateId === templateToDelete?.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      </div>
  );
};

export default Templates;
