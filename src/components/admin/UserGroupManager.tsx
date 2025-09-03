'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, Save, X } from 'lucide-react';

interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    groupPermissions: number;
  };
}

interface UserGroupForm {
  name: string;
  description: string;
  isActive: boolean;
  selectedPermissions: string[];
}

const UserGroupManager: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<UserGroupForm>({
    name: '',
    description: '',
    isActive: true,
    selectedPermissions: []
  });

  // تحميل المجموعات والصلاحيات
  useEffect(() => {
    fetchGroups();
    fetchPermissions();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/user-groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('خطأ في تحميل المجموعات:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('خطأ في تحميل الصلاحيات:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingGroup 
        ? `/api/admin/user-groups/${editingGroup.id}`
        : '/api/admin/user-groups';
      
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchGroups();
        resetForm();
        alert(editingGroup ? 'تم تحديث المجموعة بنجاح' : 'تم إنشاء المجموعة بنجاح');
      } else {
        alert('حدث خطأ أثناء حفظ المجموعة');
      }
    } catch (error) {
      console.error('خطأ في حفظ المجموعة:', error);
      alert('حدث خطأ أثناء حفظ المجموعة');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (group: UserGroup) => {
    setEditingGroup(group);
    
    // تحميل صلاحيات المجموعة
    try {
      const response = await fetch(`/api/admin/user-groups/${group.id}/permissions`);
      const groupPermissions = await response.json();
      
      setFormData({
        name: group.name,
        description: group.description || '',
        isActive: group.isActive,
        selectedPermissions: groupPermissions.map((p: any) => p.permissionId)
      });
      
      setShowForm(true);
    } catch (error) {
      console.error('خطأ في تحميل صلاحيات المجموعة:', error);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;

    try {
      const response = await fetch(`/api/admin/user-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGroups();
        alert('تم حذف المجموعة بنجاح');
      } else {
        alert('حدث خطأ أثناء حذف المجموعة');
      }
    } catch (error) {
      console.error('خطأ في حذف المجموعة:', error);
      alert('حدث خطأ أثناء حذف المجموعة');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      selectedPermissions: []
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  // تجميع الصلاحيات حسب الوحدة
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة مجموعات المستخدمين</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          إضافة مجموعة جديدة
        </button>
      </div>

      {/* نموذج إضافة/تعديل المجموعة */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* معلومات المجموعة الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المجموعة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: قسم المحاسبة، مدراء الفنادق، فريق الصيانة"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    حالة المجموعة
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">نشطة</option>
                    <option value="false">غير نشطة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف المجموعة
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="وصف مختصر لدور ومسؤوليات هذه المجموعة"
                />
              </div>

              {/* اختيار الصلاحيات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  صلاحيات المجموعة
                </label>
                
                <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <div key={module} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Shield size={16} />
                        {module}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {modulePermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedPermissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.action}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-500">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* أزرار الحفظ والإلغاء */}
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
                  {loading ? 'جاري الحفظ...' : (editingGroup ? 'تحديث' : 'إنشاء')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة المجموعات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المجموعة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عدد المستخدمين
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عدد الصلاحيات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {group.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {group.description || 'لا يوجد وصف'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {group._count?.users || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {group._count?.groupPermissions || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      group.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {group.isActive ? 'نشطة' : 'غير نشطة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(group.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-blue-600 hover:text-blue-900"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
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
        
        {groups.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مجموعات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء مجموعة مستخدمين جديدة</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              إضافة مجموعة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGroupManager;