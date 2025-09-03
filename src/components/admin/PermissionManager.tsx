'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Save, X, Search, Filter } from 'lucide-react';

interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
  _count?: {
    groupPermissions: number;
    userPermissions: number;
  };
}

interface PermissionForm {
  module: string;
  action: string;
  description: string;
}

const PermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  
  const [formData, setFormData] = useState<PermissionForm>({
    module: '',
    action: '',
    description: ''
  });

  // قائمة الوحدات المقترحة (يمكن للأدمن إضافة وحدات جديدة)
  const suggestedModules = [
    'Hotels', 'Rooms', 'Bookings', 'Guests', 'Payments', 'Reports',
    'Users', 'UserGroups', 'Permissions', 'Settings',
    'Maintenance', 'Inventory', 'Marketing', 'Finance', 'Analytics',
    'CustomerService', 'Housekeeping', 'Security', 'Events', 'Spa'
  ];

  // قائمة العمليات المقترحة (يمكن للأدمن إضافة عمليات جديدة)
  const suggestedActions = [
    'create', 'read', 'update', 'delete', 'view', 'edit',
    'approve', 'reject', 'cancel', 'restore', 'archive',
    'export', 'import', 'print', 'email', 'sms',
    'assign', 'unassign', 'transfer', 'duplicate',
    'publish', 'unpublish', 'schedule', 'activate', 'deactivate'
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    filterPermissions();
  }, [permissions, searchTerm, selectedModule]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('خطأ في تحميل الصلاحيات:', error);
    }
  };

  const filterPermissions = () => {
    let filtered = permissions;

    if (searchTerm) {
      filtered = filtered.filter(permission => 
        permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedModule) {
      filtered = filtered.filter(permission => permission.module === selectedModule);
    }

    setFilteredPermissions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPermission 
        ? `/api/admin/permissions/${editingPermission.id}`
        : '/api/admin/permissions';
      
      const method = editingPermission ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPermissions();
        resetForm();
        alert(editingPermission ? 'تم تحديث الصلاحية بنجاح' : 'تم إنشاء الصلاحية بنجاح');
      } else {
        const error = await response.json();
        alert(error.message || 'حدث خطأ أثناء حفظ الصلاحية');
      }
    } catch (error) {
      console.error('خطأ في حفظ الصلاحية:', error);
      alert('حدث خطأ أثناء حفظ الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      module: permission.module,
      action: permission.action,
      description: permission.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (permissionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصلاحية؟ سيتم حذفها من جميع المجموعات والمستخدمين.')) return;

    try {
      const response = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPermissions();
        alert('تم حذف الصلاحية بنجاح');
      } else {
        const error = await response.json();
        alert(error.message || 'حدث خطأ أثناء حذف الصلاحية');
      }
    } catch (error) {
      console.error('خطأ في حذف الصلاحية:', error);
      alert('حدث خطأ أثناء حذف الصلاحية');
    }
  };

  const resetForm = () => {
    setFormData({
      module: '',
      action: '',
      description: ''
    });
    setEditingPermission(null);
    setShowForm(false);
  };

  // الحصول على قائمة الوحدات الفريدة
  const uniqueModules = Array.from(new Set(permissions.map(p => p.module))).sort();

  // تجميع الصلاحيات حسب الوحدة
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الصلاحيات</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          إضافة صلاحية جديدة
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الصلاحيات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">جميع الوحدات</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600 flex items-center">
            إجمالي الصلاحيات: {filteredPermissions.length}
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تعديل الصلاحية */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingPermission ? 'تعديل الصلاحية' : 'إضافة صلاحية جديدة'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوحدة (Module) *
                </label>
                <input
                  type="text"
                  list="modules"
                  value={formData.module}
                  onChange={(e) => setFormData(prev => ({ ...prev, module: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: Hotels, Maintenance, CustomerService"
                  required
                />
                <datalist id="modules">
                  {suggestedModules.map(module => (
                    <option key={module} value={module} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك اختيار وحدة موجودة أو كتابة اسم وحدة جديدة
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العملية (Action) *
                </label>
                <input
                  type="text"
                  list="actions"
                  value={formData.action}
                  onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: create, approve, export"
                  required
                />
                <datalist id="actions">
                  {suggestedActions.map(action => (
                    <option key={action} value={action} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك اختيار عملية موجودة أو كتابة اسم عملية جديدة
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="وصف مفصل للصلاحية ومتى تُستخدم"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} />
                  {loading ? 'جاري الحفظ...' : (editingPermission ? 'تحديث' : 'إنشاء')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* عرض الصلاحيات مجمعة حسب الوحدة */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
          <div key={module} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                {module}
                <span className="text-sm text-gray-500">({modulePermissions.length} صلاحية)</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العملية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الوصف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المجموعات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدمين
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modulePermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {permission.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {permission.description || 'لا يوجد وصف'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {permission._count?.groupPermissions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {permission._count?.userPermissions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(permission)}
                            className="text-blue-600 hover:text-blue-900"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(permission.id)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="text-center py-12">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedModule ? 'لا توجد نتائج' : 'لا توجد صلاحيات'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedModule 
              ? 'جرب تغيير معايير البحث أو الفلترة'
              : 'ابدأ بإنشاء صلاحية جديدة'
            }
          </p>
          {!searchTerm && !selectedModule && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              إضافة صلاحية جديدة
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionManager;